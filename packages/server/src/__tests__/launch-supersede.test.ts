/**
 * The relaunch race: the frozen native redials ~1 s after any socket close. If
 * `launch` tombstoned the live session and claimed the next login BEFORE the
 * driver's terminate-first ran, the OLD process's redial took the claim,
 * `simctl terminate` then killed it, and the client got a handle on a corpse.
 * The claim is armed at the spawn (`onSpawn`), when the old process is already
 * dead — this test plays the redialing native against a slow terminate and
 * drives the new handle.
 */
import { describe, it, expect, afterEach } from 'vitest';
import type { InvokeParams, InvokeResult, LaunchAppParams, LaunchAppResult } from '@detox-remote/protocol';
import type { DeviceInfo, SimulatorOps } from '@detox-remote/driver-ios';

import { DetoxServerImpl } from '../DetoxServerImpl';
import type { DetoxServerPeer } from '../DetoxServerPeer';
import { iosHost, type IosHost } from './_ios-harness';

type UndoFn = () => void | Promise<void>;
interface HandlerCtx {
  signal?: AbortSignal;
  onUndo?: (fn: UndoFn) => void;
}
type Handler<P, R> = (params: P, ctx: HandlerCtx) => Promise<R>;
interface AllocateResponse {
  allocationId: string;
}

function capturingPeer() {
  const handlers = new Map<string, Handler<never, unknown>>();
  const registrars: Record<string, string> = {
    onAllocateDevice: 'allocate',
    onLaunchApp: 'launchApp',
    onInvoke: 'invoke',
  };
  const peer = new Proxy(
    {},
    {
      get: (_target, prop: string) => {
        const key = registrars[prop];
        if (key) return (handler: Handler<never, unknown>) => handlers.set(key, handler);
        return () => {};
      },
    },
  ) as DetoxServerPeer;
  const call =
    <P, R>(key: string): Handler<P, R> =>
    async (params, ctx) => {
      const handler = handlers.get(key);
      if (!handler) throw new Error(`${key} handler was never registered`);
      const undo: UndoFn[] = [];
      try {
        return (await handler(params as never, { ...ctx, onUndo: (fn: UndoFn) => undo.push(fn) })) as R;
      } catch (err) {
        for (let i = undo.length - 1; i >= 0; i--) await Promise.resolve(undo[i]()).catch(() => undefined);
        throw err;
      }
    };
  return {
    peer,
    allocate: call<{ type: string }, AllocateResponse>('allocate'),
    launchApp: call<LaunchAppParams, LaunchAppResult>('launchApp'),
    invoke: call<InvokeParams, InvokeResult>('invoke'),
  };
}

interface InboundFrame {
  type: string;
  messageId?: number;
}

/** A native that answers the handshake, echoes invokes, and REDIALS 50 ms after any close while it lives. */
class FakeNative {
  readonly sockets: WebSocket[] = [];
  alive = true;
  invokes = 0;
  constructor(
    private readonly url: string,
    private readonly sessionId: string,
  ) {}
  dial(): void {
    if (!this.alive) return;
    const ws = new WebSocket(this.url);
    this.sockets.push(ws);
    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({ type: 'login', messageId: 0, params: { sessionId: this.sessionId, role: 'app' } }));
    });
    ws.addEventListener('message', (event) => {
      const frame = JSON.parse(String(event.data)) as InboundFrame;
      if (frame.type === 'isReady') ws.send(JSON.stringify({ type: 'ready', messageId: -1000 }));
      if (frame.type === 'invoke') {
        this.invokes += 1;
        ws.send(JSON.stringify({ type: 'invokeResult', messageId: frame.messageId, params: {} }));
      }
    });
    ws.addEventListener('close', () => {
      setTimeout(() => this.dial(), 50);
    });
  }
  kill(): void {
    this.alive = false;
    for (const ws of this.sockets) ws.close();
  }
}

interface FakeLaunch {
  udid: string;
  bundleId: string;
  detox?: { serverUrl: string; sessionId: string };
}

const hosts: IosHost[] = [];
afterEach(async () => {
  for (const host of hosts.splice(0)) await host.close().catch(() => undefined);
});

describe('a relaunch claims the login of the process it spawned, never the old one’s redial', () => {
  it('binds the new handle to the new process when terminate-first is slow and the old native redials', async () => {
    const natives: FakeNative[] = [];
    const devices: DeviceInfo[] = [{ name: 'iPhone 17', udid: 'udid-1', state: 'Shutdown', os: { platform: 'iOS', name: 'iOS 26.5' } } as DeviceInfo];
    const simulatorOps = {
      list: async () => devices,
      boot: async () => true,
      shutdown: async () => true,
      resolveFrameworkPath: async () => '/fake/Detox.framework/Detox',
      launch: async ({ detox }: FakeLaunch) => {
        const native = new FakeNative(detox?.serverUrl ?? '', detox?.sessionId ?? '');
        natives.push(native);
        native.dial();
        return 4242 + natives.length;
      },
      // A slow terminate: the old process lives on for 300 ms — long enough for a redial.
      terminate: async () => {
        await new Promise((resolve) => setTimeout(resolve, 300));
        natives[0]?.kill();
      },
    } as unknown as SimulatorOps;
    const host = iosHost(simulatorOps);
    hosts.push(host);
    const { peer, allocate, launchApp, invoke } = capturingPeer();
    new DetoxServerImpl({ serverPeer: peer, driverHost: host.host });

    const { allocationId } = await allocate({ type: 'ios.simulator' }, {});
    const first = await launchApp({ allocationId, appId: 'com.example.app' }, {});
    expect(first.pid).toBe(4243);

    const second = await launchApp({ allocationId, appId: 'com.example.app' }, {});
    expect(second.pid).toBe(4244);
    // The handle drives the NEW process: an invoke round-trips through it, not through a corpse.
    await invoke({ allocationId, appHandleId: second.appHandleId, invocation: { type: 'action', action: 'tap' } }, {});
    expect(natives[1]?.invokes).toBe(1);
    expect(natives[0]?.invokes).toBe(0);
    for (const native of natives) native.kill();
  });
});
