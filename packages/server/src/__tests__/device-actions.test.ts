import { describe, it, expect, afterEach } from 'vitest';
import type { LaunchAppParams, LaunchAppResult, SendToHomeParams } from '@detox-remote/protocol';
import type { DeviceInfo } from '@detox-remote/driver-ios';
import { DetoxErrorCode } from '@detox-remote/core';

import { DetoxServerImpl } from '../DetoxServerImpl';
import type { DetoxServerPeer } from '../DetoxServerPeer';
import type { SimulatorOps } from '@detox-remote/driver-ios';
import { iosHost, type IosHost } from './_ios-harness';

type UndoFn = () => void | Promise<void>;

interface HandlerCtx {
  signal?: AbortSignal;
  progress?: (value: unknown) => void;
  onUndo?: (fn: UndoFn) => void;
}

interface AllocateResponse {
  allocationId: string;
  device: { udid: string };
}

type Handler<P, R> = (params: P, ctx: HandlerCtx) => Promise<R>;

interface CapturedPeer {
  peer: DetoxServerPeer;
  allocate: Handler<{ type: string }, AllocateResponse>;
  release: Handler<{ allocationId: string }, { released: boolean }>;
  launchApp: Handler<LaunchAppParams, LaunchAppResult>;
  sendToHome: Handler<SendToHomeParams, void>;
}

/**
 * Captures the handlers `DetoxServerImpl` registers, so tests can call them
 * directly — same pattern as cancellation.test.ts, widened to device actions.
 */
function capturingPeer(): CapturedPeer {
  const handlers = new Map<string, Handler<never, unknown>>();
  const registrars: Record<string, string> = {
    onAllocateDevice: 'allocate',
    onReleaseDevice: 'release',
    onLaunchApp: 'launchApp',
    onSendToHome: 'sendToHome',
  };
  const peer = new Proxy(
    {},
    {
      get: (_target, prop: string) => {
        const key = registrars[prop];
        if (key) return (handler: Handler<never, unknown>) => handlers.set(key, handler);
        // Every other `onX` registrar and `notifyX` is irrelevant here.
        return () => {};
      },
    },
  ) as DetoxServerPeer;

  // Mirrors `Peer._handleRequest`: the handler gets a `ctx.onUndo` ledger, and
  // it unwinds LIFO when the handler ends unsuccessfully. A bare ctx would kill
  // any handler that registers a compensation.
  const call = <P, R>(key: string): Handler<P, R> => {
    return async (params, ctx) => {
      const handler = handlers.get(key);
      if (!handler) throw new Error(`${key} handler was never registered`);
      const undo: UndoFn[] = [];
      try {
        return (await handler(params as never, { ...ctx, onUndo: (fn: UndoFn) => undo.push(fn) })) as R;
      } catch (err) {
        for (let i = undo.length - 1; i >= 0; i--) {
          try {
            await undo[i]();
          } catch {
            /* reported by the peer in production, irrelevant here */
          }
        }
        throw err;
      }
    };
  };

  return {
    peer,
    allocate: call('allocate'),
    release: call('release'),
    launchApp: call('launchApp'),
    sendToHome: call('sendToHome'),
  };
}

interface LaunchCall {
  udid: string;
  bundleId: string;
}

interface FakeOps {
  simulatorOps: SimulatorOps;
  launches: LaunchCall[];
  homes: string[];
}

interface UdidArg {
  udid: string;
}

/** The one field the dialer reads off a gateway frame. */
interface InboundFrame {
  type: string;
}

/**
 * Plays the launched app's wire role just enough for a handshake: logs in
 * with the frozen convention and answers the readiness probe. The full
 * protocol-faithful fake lives in the accept helpers; this dialer only lets
 * `launchApp` (a handshake since spec 003) resolve in a unit fixture.
 */
function dialFakeApp(url: string, sessionId: string): void {
  const ws = new WebSocket(url);
  ws.addEventListener('open', () => {
    ws.send(JSON.stringify({ type: 'login', messageId: 0, params: { sessionId, role: 'app' } }));
  });
  ws.addEventListener('message', (event) => {
    const frame = JSON.parse(String(event.data)) as InboundFrame;
    if (frame.type === 'isReady') {
      ws.send(JSON.stringify({ type: 'ready', messageId: -1000 }));
    }
  });
}

/** The slice of the launch args the fake reads: what the real app reads off argv. */
interface FakeLaunch extends LaunchCall {
  detox?: { serverUrl: string; sessionId: string };
}

/** Two shutdown iPhones, so one session can hold both and address each. */
function fakeSimulatorOps(launchGate?: Promise<void>): FakeOps {
  const launches: LaunchCall[] = [];
  const homes: string[] = [];
  const devices: DeviceInfo[] = [
    { name: 'iPhone 17', udid: 'udid-1', state: 'Shutdown', os: { platform: 'iOS' } },
    { name: 'iPhone 17', udid: 'udid-2', state: 'Shutdown', os: { platform: 'iOS' } },
  ] as DeviceInfo[];
  const simulatorOps = {
    list: async () => {
      await Promise.resolve();
      return devices;
    },
    boot: async () => true,
    shutdown: async () => true,
    state: async () => 'Booted',
    terminate: async () => undefined,
    resolveFrameworkPath: async () => '/fake/Detox.framework/Detox',
    launch: async ({ udid, bundleId, detox }: FakeLaunch) => {
      if (launchGate) await launchGate;
      launches.push({ udid, bundleId });
      // The "launched process" dials home on the URL it was HANDED — the
      // per-launch claim address — exactly as the real app reads its argv.
      if (detox) dialFakeApp(detox.serverUrl, detox.sessionId);
      return 4242;
    },
    sendToHome: async ({ udid }: UdidArg) => {
      homes.push(udid);
    },
  } as unknown as SimulatorOps;
  return { simulatorOps, launches, homes };
}

const daHosts: IosHost[] = [];

afterEach(async () => {
  for (const host of daHosts.splice(0)) {
    await host.close().catch(() => undefined);
  }
});

async function makeServer(launchGate?: Promise<void>) {
  const ops = fakeSimulatorOps(launchGate);
  const host = iosHost(ops.simulatorOps);
  daHosts.push(host);
  const captured = capturingPeer();
  new DetoxServerImpl({ serverPeer: captured.peer, driverHost: host.host });
  return { ...ops, ...captured, devicePool: host.pool, host };
}

/**
 * The registry is the only address book: a device action executes on the
 * device of the allocation it names — never on "the first allocation in the
 * map", which is what the pre-registry code did and what a session holding
 * two devices would trip over.
 */
describe('device actions route by allocationId', () => {
  it('lands on the named device when the session holds two', async () => {
    const server = await makeServer();
    const first = await server.allocate({ type: 'ios.simulator' }, {});
    const second = await server.allocate({ type: 'ios.simulator' }, {});
    expect(first.device.udid).not.toBe(second.device.udid);

    const result = await server.launchApp(
      { allocationId: second.allocationId, appId: 'com.example.app' },
      {},
    );
    expect(result.pid).toBe(4242);
    // The handshake resolved through the gateway and minted an app address.
    expect(result.appHandleId).toBeTruthy();
    expect(server.launches).toEqual([{ udid: second.device.udid, bundleId: 'com.example.app' }]);

    await server.sendToHome({ allocationId: first.allocationId }, {});
    expect(server.homes).toEqual([first.device.udid]);
  });

  it('answers a released allocation with a typed stale-handle error, never a guess', async () => {
    const server = await makeServer();
    const first = await server.allocate({ type: 'ios.simulator' }, {});
    const second = await server.allocate({ type: 'ios.simulator' }, {});
    await server.release({ allocationId: first.allocationId }, {});

    await expect(
      server.sendToHome({ allocationId: first.allocationId }, {}),
    ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_STALE_HANDLE });
    // The surviving sibling was not touched by the refused call.
    expect(server.homes).toEqual([]);

    // A foreign / never-issued id gets the same refusal.
    await expect(
      server.launchApp({ allocationId: 'not-yours', appId: 'com.example.app' }, {}),
    ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_STALE_HANDLE });
    expect(server.launches).toEqual([]);

    // The still-owned allocation keeps working after its sibling's release.
    await server.sendToHome({ allocationId: second.allocationId }, {});
    expect(server.homes).toEqual([second.device.udid]);
  });

  /**
   * The property the whole change rests on: the address book is
   * per-connection. A *live* allocationId taken from another session
   * (they are guessable, and the exhaustion payload publishes them) must get
   * the same refusal as a dead one — never a cross-session action.
   */
  it('refuses a live allocationId that belongs to another connection', async () => {
    const ops = fakeSimulatorOps();
    const host = iosHost(ops.simulatorOps);
    daHosts.push(host);
    const alice = capturingPeer();
    const bob = capturingPeer();
    new DetoxServerImpl({ serverPeer: alice.peer, driverHost: host.host });
    new DetoxServerImpl({ serverPeer: bob.peer, driverHost: host.host });

    const held = await alice.allocate({ type: 'ios.simulator' }, {});

    await expect(
      bob.sendToHome({ allocationId: held.allocationId }, {}),
    ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_STALE_HANDLE });
    expect(ops.homes).toEqual([]);

    // The rightful owner is unaffected by the refused theft attempt.
    await alice.sendToHome({ allocationId: held.allocationId }, {});
    expect(ops.homes).toEqual([held.device.udid]);
  });

  /**
   * @issue DTX-6012
   * The reclaim barrier: an action still in flight must settle before the
   * udid moves on, or the next owner inherits a device the previous life is
   * still mutating. `_deviceAction` checks ownership and registers the
   * in-flight promise in the same synchronous stretch; with an await between
   * them, a concurrent release could see an empty `pending` set, free the
   * udid, and let the action land on the device's next owner.
   */
  it('release waits out an in-flight action before freeing the device', async () => {
    let openGate!: () => void;
    const gate = new Promise<void>((resolve) => {
      openGate = resolve;
    });
    const server = await makeServer(gate);
    const held = await server.allocate({ type: 'ios.simulator' }, {});

    const launching = server.launchApp(
      { allocationId: held.allocationId, appId: 'com.example.app' },
      {},
    );
    let released = false;
    const releasing = server
      .release({ allocationId: held.allocationId }, {})
      .then((response) => {
        released = true;
        return response;
      });

    // Give release every chance to (wrongly) settle while the launch hangs.
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(released).toBe(false);

    openGate();
    await Promise.all([launching, releasing]);
    expect(released).toBe(true);
    expect(server.launches).toEqual([{ udid: held.device.udid, bundleId: 'com.example.app' }]);
  });
});
