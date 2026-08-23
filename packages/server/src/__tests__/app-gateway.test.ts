/**
 * The app gateway (spec 003), unit-gated where the accept suite cannot reach:
 * the launch deadline (a deterministic never-ready fixture is a wedge test),
 * the login discipline of the app-facing port, and the correlation-space
 * bookkeeping of the session object itself.
 *
 * The gateway is REAL here (a loopback listener on an ephemeral port); only
 * simctl is faked. The "app" side is a plain WebSocket speaking the frozen
 * dialect — the protocol-faithful strict fake lives with the accept helpers.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import WsClient from 'ws';
import type { DeviceInfo, InvokeResult } from '@detox-remote/protocol';
import { DetoxErrorCode } from '@detox-remote/core';

import { AppGateway, ignoreSocketError } from '../AppGateway';
import { DetoxServerImpl } from '../DetoxServerImpl';
import { DevicePool } from '../DevicePool';
import type { DetoxServerPeer } from '../DetoxServerPeer';
import type { SimulatorOps, TerminateAppArgs } from '../SimulatorOps';

type UndoFn = () => void | Promise<void>;

interface HandlerCtx {
  signal?: AbortSignal;
  progress?: (value: unknown) => void;
  onUndo?: (fn: UndoFn) => void;
}

type Handler<P, R> = (params: P, ctx: HandlerCtx) => Promise<R>;

interface Frame {
  type: string;
  messageId: number;
  params?: Record<string, unknown>;
}

/** A scriptable fake app over a real websocket — the unit-sized testee. */
interface FakeApp {
  received: Frame[];
  send(frame: Frame): void;
  waitFor(predicate: (frame: Frame) => boolean): Promise<Frame>;
  close(): void;
  closed: Promise<void>;
}

function dialApp(
  url: string,
  sessionId: string,
  { login = true, markReady = true, binary = false }: { login?: boolean; markReady?: boolean; binary?: boolean } = {},
): FakeApp {
  const ws = new WebSocket(url);
  const received: Frame[] = [];
  const waiters: Array<{ predicate: (frame: Frame) => boolean; resolve: (frame: Frame) => void }> = [];
  let closeResolve!: () => void;
  const closed = new Promise<void>((resolve) => {
    closeResolve = resolve;
  });
  const send = (frame: Frame): void => {
    const text = JSON.stringify(frame);
    // Binary is what the real native sends — the gateway must accept it.
    ws.send(binary ? new TextEncoder().encode(text) : text);
  };
  ws.addEventListener('open', () => {
    if (login) send({ type: 'login', messageId: 0, params: { sessionId, role: 'app' } });
  });
  const handleMessage = async (data: unknown): Promise<void> => {
    const text =
      typeof data === 'string'
        ? data
        : data instanceof ArrayBuffer
          ? new TextDecoder().decode(data)
          : await (data as Blob).text();
    const frame = JSON.parse(text) as Frame;
    received.push(frame);
    if (markReady && frame.type === 'isReady') send({ type: 'ready', messageId: -1000 });
    const at = waiters.findIndex((waiter) => waiter.predicate(frame));
    if (at >= 0) waiters.splice(at, 1)[0].resolve(frame);
  };
  ws.addEventListener('message', (event) => {
    void handleMessage(event.data as unknown);
  });
  ws.addEventListener('close', () => closeResolve());
  return {
    received,
    send,
    waitFor: (predicate) => {
      const hit = received.find(predicate);
      if (hit) return Promise.resolve(hit);
      return new Promise((resolve) => waiters.push({ predicate, resolve }));
    },
    close: () => ws.close(),
    closed,
  };
}

interface CapturedPeer {
  peer: DetoxServerPeer;
  handlers: Map<string, Handler<never, unknown>>;
}

function capturingPeer(): CapturedPeer {
  const handlers = new Map<string, Handler<never, unknown>>();
  const peer = new Proxy(
    {},
    {
      get: (_target, prop: string) => {
        if (prop.startsWith('on')) {
          const key = prop[2].toLowerCase() + prop.slice(3);
          return (handler: Handler<never, unknown>) => handlers.set(key, handler);
        }
        return () => {};
      },
    },
  ) as DetoxServerPeer;
  return { peer, handlers };
}

/**
 * Invokes a registered handler under the same contract `Peer._handleRequest`
 * gives it — including the `ctx.onUndo` ledger, unwound LIFO when the handler
 * ends unsuccessfully. Fixtures used to pass a bare ctx; a handler that
 * registers a compensation would then die on `ctx.onUndo`, and one that fails
 * would leave its effects standing, which is not what the peer does.
 */
function call<P, R>(handlers: Map<string, Handler<never, unknown>>, key: string): Handler<P, R> {
  return async (params, ctx) => {
    const handler = handlers.get(key);
    if (!handler) throw new Error(`${key} handler was never registered`);
    const undo: UndoFn[] = [];
    try {
      return (await handler(params as never, { ...ctx, onUndo: (fn: UndoFn) => undo.push(fn) })) as R;
    } catch (err) {
      for (let i = undo.length - 1; i >= 0; i--) {
        // The peer reports a throwing compensation through `onError` and keeps
        // unwinding; a fixture only needs the rest of the stack to still run.
        try {
          await undo[i]();
        } catch {
          /* reported by the peer in production, irrelevant here */
        }
      }
      throw err;
    }
  };
}

type CancelOutcome = 'undone' | 'nothing-to-undo' | 'undo-failed' | 'unknown';

interface RetainedCall<R> {
  result: Promise<R>;
  /**
   * Runs the rollback a LATE `$/cancelRequest` runs — the request was already
   * answered and the peer kept its ledger for exactly this — and reports the
   * outcome word that answer carries.
   */
  cancelLate: () => Promise<CancelOutcome>;
}

/**
 * {@link call}, but keeping the ledger after a SUCCESSFUL answer instead of
 * dropping it — the peer's retention window, which is where race R2 lives.
 */
function callRetained<P, R>(
  handlers: Map<string, Handler<never, unknown>>,
  key: string,
): (params: P, ctx?: HandlerCtx) => RetainedCall<R> {
  return (params, ctx = {}) => {
    const handler = handlers.get(key);
    if (!handler) throw new Error(`${key} handler was never registered`);
    const fns: UndoFn[] = [];
    let ran: Promise<CancelOutcome> | undefined;
    const run = (): Promise<CancelOutcome> =>
      (ran ??= (async () => {
        if (fns.length === 0) return 'nothing-to-undo';
        let failed = false;
        for (let i = fns.length - 1; i >= 0; i--) {
          try {
            await fns[i]();
          } catch {
            failed = true;
          }
        }
        return failed ? 'undo-failed' : 'undone';
      })());
    const result = (async () => {
      try {
        return (await handler(params as never, {
          ...ctx,
          onUndo: (fn: UndoFn) => fns.push(fn),
        })) as R;
      } catch (err) {
        await run();
        throw err;
      }
    })();
    return { result, cancelLate: run };
  };
}

interface AllocateResponse {
  allocationId: string;
  device: { udid: string };
}

interface LaunchResponse {
  pid: number;
  appHandleId: string;
}

const gateways: AppGateway[] = [];
afterEach(async () => {
  for (const gateway of gateways.splice(0)) {
    await gateway.close().catch(() => undefined);
  }
});

/** The slice of `LaunchAppArgs` the fake launch reads — what a real app reads off argv. */
interface LaunchSlice {
  bundleId: string;
  detox?: { serverUrl: string; sessionId: string };
}

/** The node internals the RST test reaches for. */
interface Resettable {
  resetAndDestroy?: () => void;
  destroy: () => void;
}

interface RawSocketCarrier {
  _socket: Resettable;
}

interface ServerOptions {
  /** What the fake "process" does when simctl launch runs. */
  onLaunch?: (gatewayUrl: string, bundleId: string) => void;
  onTerminate?: (args: TerminateAppArgs) => unknown;
  /** Awaited before the fake simctl launch "spawns" — for barrier tests. */
  launchGate?: Promise<void>;
  /** Awaited inside the fake `simctl erase` — for the erase-barrier test. */
  eraseGate?: Promise<void>;
  /** Notes the order in which physical operations actually landed. */
  trace?: string[];
  launchReadyTimeoutMs?: number;
  /**
   * The device was already up when allocated (a warm handoff): `boot` reports
   * no physical boot, so the allocation is NOT known launch-free and the
   * launch handshake must keep its terminate-first step.
   */
  alreadyBooted?: boolean;
}

async function makeServer(options: ServerOptions = {}) {
  const gateway = await AppGateway.listen();
  gateways.push(gateway);
  const devices: DeviceInfo[] = [
    { name: 'iPhone 17', udid: 'udid-1', state: 'Shutdown', os: { platform: 'iOS' } },
  ] as DeviceInfo[];
  const simulatorOps = {
    list: async () => devices,
    boot: async () => !options.alreadyBooted,
    shutdown: async () => true,
    openUrl: async () => undefined,
    terminate: async (args: TerminateAppArgs) => {
      options.trace?.push(`terminate:${args.bundleId}`);
      await options.onTerminate?.(args);
    },
    erase: async () => {
      options.trace?.push('erase');
      if (options.eraseGate) await options.eraseGate;
    },
    resolveFrameworkPath: async () => '/fake/Detox.framework/Detox',
    launch: async ({ bundleId, detox }: LaunchSlice) => {
      if (options.launchGate) await options.launchGate;
      // The claim URL the server hands the process — the fake app dials it
      // verbatim, exactly as the real app reads its own argv.
      options.onLaunch?.(detox?.serverUrl ?? gateway.url, bundleId);
      return 4242;
    },
  } as unknown as SimulatorOps;
  const devicePool = new DevicePool({ simulatorOps, maxPool: 4 });
  const captured = capturingPeer();
  const impl = new DetoxServerImpl({
    serverPeer: captured.peer,
    devicePool,
    simulatorOps,
    appGateway: gateway,
    config: { launchReadyTimeoutMs: options.launchReadyTimeoutMs },
  });
  const allocate = call<{ type: string }, AllocateResponse>(captured.handlers, 'allocateDevice');
  const launchApp = call<{ allocationId: string; appId: string }, LaunchResponse>(
    captured.handlers,
    'launchApp',
  );
  const launchAppRetained = callRetained<{ allocationId: string; appId: string }, LaunchResponse>(
    captured.handlers,
    'launchApp',
  );
  const terminateApp = call<
    { allocationId: string; appId?: string; appHandleId?: string },
    void
  >(captured.handlers, 'terminateApp');
  const invoke = call<
    { allocationId: string; appHandleId: string; invocation: Record<string, unknown> },
    InvokeResult
  >(captured.handlers, 'invoke');
  const reloadReactNative = call<{ allocationId: string; appHandleId: string }, void>(
    captured.handlers,
    'reloadReactNative',
  );
  const release = call<{ allocationId: string }, { released: boolean }>(
    captured.handlers,
    'releaseDevice',
  );
  const openURL = call<{ allocationId: string; url: string }, void>(captured.handlers, 'openURL');
  const bootDevice = call<{ allocationId: string }, { state: string }>(
    captured.handlers,
    'bootDevice',
  );
  const shutdownDevice = call<{ allocationId: string }, { state: string }>(
    captured.handlers,
    'shutdownDevice',
  );
  const resetContentAndSettings = call<{ allocationId: string }, void>(
    captured.handlers,
    'resetContentAndSettings',
  );
  return {
    resetContentAndSettings,
    gateway,
    impl,
    allocate,
    launchApp,
    launchAppRetained,
    terminateApp,
    invoke,
    reloadReactNative,
    release,
    openURL,
    bootDevice,
    shutdownDevice,
  };
}

describe('the launch handshake', () => {
  /**
   * @issue DTX-6158
   * Native parity, in order: the login is answered echoing the login's
   * own messageId (the native force-unwraps the reply — hardcoded 0 on
   * its side), then readiness is probed once with the frozen sentinel.
   */
  it('resolves only through login + ready, echoing the login id and probing with the frozen sentinel', async () => {
    let app!: FakeApp;
    const server = await makeServer({
      onLaunch: (url, bundleId) => {
        app = dialApp(url, bundleId);
      },
    });
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    const launched = await server.launchApp(
      { allocationId: allocation.allocationId, appId: 'com.example.app' },
      {},
    );
    expect(launched.pid).toBe(4242);
    expect(launched.appHandleId).toBeTruthy();

    const loginReply = await app.waitFor((frame) => frame.type === 'loginSuccess');
    expect(loginReply.messageId).toBe(0);
    const probe = await app.waitFor((frame) => frame.type === 'isReady');
    expect(probe.messageId).toBe(-1000);
  });

  it('dies typed on the deadline when the app never becomes ready — never hangs', async () => {
    const server = await makeServer({
      // The "app" logs in but never answers the readiness probe.
      onLaunch: (url, bundleId) => dialApp(url, bundleId, { markReady: false }),
      launchReadyTimeoutMs: 150,
    });
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    await expect(
      server.launchApp({ allocationId: allocation.allocationId, appId: 'com.example.app' }, {}),
    ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_APP_DIED });
  });

  it('dies typed when the process never connects at all', async () => {
    const server = await makeServer({ launchReadyTimeoutMs: 150 });
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    await expect(
      server.launchApp({ allocationId: allocation.allocationId, appId: 'com.example.app' }, {}),
    ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_APP_DIED });
  });

  it('skips terminate-first on a clean server boot, then terminates on relaunch (the simctl-hang probe)', async () => {
    const order: string[] = [];
    const server = await makeServer({
      onLaunch: (url, bundleId) => {
        order.push('launch');
        dialApp(url, bundleId);
      },
      onTerminate: () => order.push('terminate'),
    });
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    // First launch on a device the server itself booted: nothing can be
    // running, and terminate-first is the hazard (it wedges on cold boots), so
    // the handshake goes straight to launch.
    await server.launchApp({ allocationId: allocation.allocationId, appId: 'com.example.app' }, {});
    expect(order).toEqual(['launch']);

    // A relaunch is exactly the probed hang case — the previous instance is
    // live, and launching over it would wedge the device's simctl.
    await server.launchApp({ allocationId: allocation.allocationId, appId: 'com.example.app' }, {});
    expect(order).toEqual(['launch', 'terminate', 'launch']);
  });

  it('openURL spoils the clean boot — it launches a process the flag cannot see past', async () => {
    const order: string[] = [];
    const server = await makeServer({
      onLaunch: (url, bundleId) => {
        order.push('launch');
        dialApp(url, bundleId);
      },
      onTerminate: () => order.push('terminate'),
    });
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    await server.openURL({ allocationId: allocation.allocationId, url: 'https://example.com' }, {});
    await server.launchApp({ allocationId: allocation.allocationId, appId: 'com.example.app' }, {});
    expect(order).toEqual(['terminate', 'launch']);
  });

  it('an explicit physical boot restores the skip; shutdown alone clears it', async () => {
    const order: string[] = [];
    const server = await makeServer({
      onLaunch: (url, bundleId) => {
        order.push('launch');
        dialApp(url, bundleId);
      },
      onTerminate: () => order.push('terminate'),
    });
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    await server.launchApp({ allocationId: allocation.allocationId, appId: 'com.example.app' }, {});
    expect(order).toEqual(['launch']); // clean boot — no terminate-first

    // Cycle the device: the fresh physical boot proves it launch-free again.
    await server.shutdownDevice({ allocationId: allocation.allocationId }, {});
    await server.bootDevice({ allocationId: allocation.allocationId }, {});
    await server.launchApp({ allocationId: allocation.allocationId, appId: 'com.example.app' }, {});
    expect(order).toEqual(['launch', 'launch']);
  });

  it('a warm handoff still terminates first — the previous holder may have left the app running', async () => {
    const order: string[] = [];
    const server = await makeServer({
      alreadyBooted: true,
      onLaunch: (url, bundleId) => {
        order.push('launch');
        dialApp(url, bundleId);
      },
      onTerminate: () => order.push('terminate'),
    });
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    await server.launchApp({ allocationId: allocation.allocationId, appId: 'com.example.app' }, {});
    expect(order).toEqual(['terminate', 'launch']);
  });

  it('an aborted launch cleans up: the claim is withdrawn and the process terminated', async () => {
    const terminated: string[] = [];
    let launched = false;
    const server = await makeServer({
      // The process starts but the app never logs in — the launch waits.
      onLaunch: () => {
        launched = true;
      },
      onTerminate: ({ bundleId }) => {
        terminated.push(bundleId);
        // The compensation terminate failing must be swallowed — cleanup is
        // best-effort, the abort is the story. (No terminate-first here: the
        // allocation rode a clean server boot.)
        throw new Error('terminate exploded');
      },
    });
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    const aborter = new AbortController();
    const launching = server.launchApp(
      { allocationId: allocation.allocationId, appId: 'com.example.app' },
      { signal: aborter.signal },
    );
    // Let the fake simctl launch complete before aborting.
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(launched).toBe(true);
    aborter.abort(new Error('changed my mind'));
    await expect(launching).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_ABORTED });
    // The one terminate is the abort compensation (terminate-first was
    // skipped: clean server boot).
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(terminated).toEqual(['com.example.app']);
  });
});

/**
 * Race R2 at the app level — the twin of the allocation case in
 * `cancellation.test.ts`. A `$/cancelRequest` that arrives after `launchApp`
 * was already answered finds the client has thrown the response away, and with
 * it the `appHandleId` that was the only address anyone had on a live,
 * instrumented app. The ledger has to take that launch back; the tests below
 * pin both halves of "take back" — what it kills, and what it must not.
 */
describe('launchApp cancelled after it succeeded', () => {
  it('terminates the app it launched and drops the handle', async () => {
    const terminated: string[] = [];
    const server = await makeServer({
      onLaunch: (url, bundleId) => dialApp(url, bundleId),
      onTerminate: (args) => terminated.push(args.bundleId),
    });
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    const launch = server.launchAppRetained({
      allocationId: allocation.allocationId,
      appId: 'com.example.app',
    });
    const launched = await launch.result;
    // The server booted this device itself, so the handshake skipped
    // terminate-first: any terminate from here on is the rollback's.
    expect(terminated).toEqual([]);

    expect(await launch.cancelLate()).toBe('undone');
    expect(terminated).toEqual(['com.example.app']);
    await expect(
      server.invoke(
        {
          allocationId: allocation.allocationId,
          appHandleId: launched.appHandleId,
          invocation: { type: 'action' },
        },
        {},
      ),
    ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_APP_DIED });
  });

  it('kills nothing once the device belongs to another allocation', async () => {
    const terminated: string[] = [];
    const server = await makeServer({
      onLaunch: (url, bundleId) => dialApp(url, bundleId),
      onTerminate: (args) => terminated.push(args.bundleId),
    });
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    const launch = server.launchAppRetained({
      allocationId: allocation.allocationId,
      appId: 'com.example.app',
    });
    await launch.result;
    await server.release({ allocationId: allocation.allocationId }, {});
    // The device is picked up again — a different allocation id is exactly what
    // "somebody else's device" means to the registry, whoever holds it. A
    // rollback addressing the app by bundle id alone would reach into their
    // session: the theft both reviews reproduced one level up.
    const next = await server.allocate({ type: 'ios.simulator' }, {});
    expect(next.device.udid).toBe(allocation.device.udid);

    // Still `undone`: every registered compensation ran to completion, and this
    // one's completion is deciding there is nothing of ours left to take back.
    expect(await launch.cancelLate()).toBe('undone');
    expect(terminated).toEqual([]);
  });

  it('still cleans up a launch on a device nobody holds — free is not the same as stolen', async () => {
    const terminated: string[] = [];
    const server = await makeServer({
      onLaunch: (url, bundleId) => dialApp(url, bundleId),
      onTerminate: (args) => terminated.push(args.bundleId),
    });
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    const launch = server.launchAppRetained({
      allocationId: allocation.allocationId,
      appId: 'com.example.app',
    });
    await launch.result;
    // Released and not taken by anyone: our process is the only thing left on
    // that device, and leaving it running would hand the next owner a warm
    // device with a stranger's instrumented app already on it.
    await server.release({ allocationId: allocation.allocationId }, {});

    expect(await launch.cancelLate()).toBe('undone');
    expect(terminated).toEqual(['com.example.app']);
  });

  it('does not kill the instance that superseded it', async () => {
    const terminated: string[] = [];
    const server = await makeServer({
      onLaunch: (url, bundleId) => dialApp(url, bundleId),
      onTerminate: (args) => terminated.push(args.bundleId),
    });
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    const first = server.launchAppRetained({
      allocationId: allocation.allocationId,
      appId: 'com.example.app',
    });
    await first.result;
    // A relaunch supersedes: its own terminate-first kills our process, and the
    // process now answering to this bundle id belongs to the second launch.
    await server.launchApp({ allocationId: allocation.allocationId, appId: 'com.example.app' }, {});
    expect(terminated).toEqual(['com.example.app']);

    expect(await first.cancelLate()).toBe('undone');
    // Unchanged: a second terminate here would be the first launch's rollback
    // killing the second launch's app.
    expect(terminated).toEqual(['com.example.app']);
  });

  it('still kills its own app when a DIFFERENT app launched after it', async () => {
    const terminated: string[] = [];
    const server = await makeServer({
      onLaunch: (url, bundleId) => dialApp(url, bundleId),
      onTerminate: (args) => terminated.push(args.bundleId),
    });
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    const first = server.launchAppRetained({
      allocationId: allocation.allocationId,
      appId: 'com.example.app',
    });
    await first.result;
    // Two apps on one device is a supported case (spec 003), and the second
    // launch supersedes NOTHING: it took a different bundle id, so the first
    // app is still the process answering to `com.example.app`. A device-wide
    // launch counter cannot tell this apart from a relaunch, and reading it
    // here would silence the rollback and strand a live instrumented app.
    await server.launchApp({ allocationId: allocation.allocationId, appId: 'com.example.other' }, {});
    // Its own terminate-first, addressed at its own bundle id — ours is
    // untouched and still running.
    expect(terminated).toEqual(['com.example.other']);

    expect(await first.cancelLate()).toBe('undone');
    expect(terminated).toEqual(['com.example.other', 'com.example.app']);
  });

  it('fences the device while it terminates, so nobody is handed it mid-cleanup', async () => {
    let letTerminateFinish!: () => void;
    const terminateRunning = new Promise<void>((resolve) => {
      letTerminateFinish = resolve;
    });
    const started: string[] = [];
    const server = await makeServer({
      onLaunch: (url, bundleId) => dialApp(url, bundleId),
      onTerminate: (args) => {
        started.push(args.bundleId);
        return terminateRunning;
      },
    });
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    const launch = server.launchAppRetained({
      allocationId: allocation.allocationId,
      appId: 'com.example.app',
    });
    await launch.result;
    await server.release({ allocationId: allocation.allocationId }, {});

    // The rollback is now inside `simctl terminate`, which in the wild runs for
    // seconds and can wedge for a minute. Whoever is handed this device in that
    // window gets their app killed by our command.
    const unwinding = launch.cancelLate();
    await vi.waitFor(() => expect(started).toEqual(['com.example.app']));
    await expect(server.allocate({ type: 'ios.simulator' }, {})).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_POOL_EXHAUSTED,
    });

    letTerminateFinish();
    expect(await unwinding).toBe('undone');
    // Fence lifted with the command: the device is ordinary capacity again.
    const next = await server.allocate({ type: 'ios.simulator' }, {});
    expect(next.device.udid).toBe(allocation.device.udid);
  });

  it('waits out an erase in flight instead of running simctl over it', async () => {
    let letEraseFinish!: () => void;
    const eraseRunning = new Promise<void>((resolve) => {
      letEraseFinish = resolve;
    });
    const trace: string[] = [];
    const server = await makeServer({
      onLaunch: (url, bundleId) => dialApp(url, bundleId),
      eraseGate: eraseRunning,
      trace,
    });
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    const launch = server.launchAppRetained({
      allocationId: allocation.allocationId,
      appId: 'com.example.app',
    });
    await launch.result;

    // The wipe is the one child nobody may kill; every
    // other operation on the allocation waits it out, and a compensation is not
    // an exception — two simctl commands mutating one device is the race the
    // barrier exists to forbid.
    const wipe = server.resetContentAndSettings({ allocationId: allocation.allocationId }, {});
    await vi.waitFor(() => expect(trace).toContain('erase'));
    const unwinding = launch.cancelLate();
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(trace.filter((t) => t.startsWith('terminate'))).toEqual([]);

    letEraseFinish();
    await wipe;
    expect(await unwinding).toBe('undone');
    expect(trace.indexOf('erase')).toBeLessThan(trace.lastIndexOf('terminate:com.example.app'));
  });

  it('hands the bundle claim back when its own launch never spawned', async () => {
    const terminated: string[] = [];
    let spawns = 0;
    const server = await makeServer({
      onLaunch: (url, bundleId) => {
        // The second launch of this bundle dies before producing a pid — the
        // probed hang, a wedged spawn, a killed child.
        if (++spawns === 2) throw new Error('simctl launch failed');
        dialApp(url, bundleId);
      },
      onTerminate: (args) => {
        terminated.push(args.bundleId);
      },
    });
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    const first = server.launchAppRetained({
      allocationId: allocation.allocationId,
      appId: 'com.example.app',
    });
    await first.result;
    await expect(
      server.launchApp({ allocationId: allocation.allocationId, appId: 'com.example.app' }, {}),
    ).rejects.toThrow();
    // Its terminate-first ran; its own spawn did not. It therefore owns no
    // process, and holding the bundle's claim would silence the rollback of the
    // launch that DOES — leaving a live instrumented app nobody can address.
    expect(terminated).toEqual(['com.example.app']);

    expect(await first.cancelLate()).toBe('undone');
    expect(terminated).toEqual(['com.example.app', 'com.example.app']);
  });

  it('reports undo-failed when the app refuses to die, and still drops the handle', async () => {
    const server = await makeServer({
      onLaunch: (url, bundleId) => dialApp(url, bundleId),
      onTerminate: () => {
        throw new Error('simctl terminate wedged');
      },
    });
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    const launch = server.launchAppRetained({
      allocationId: allocation.allocationId,
      appId: 'com.example.app',
    });
    const launched = await launch.result;

    // An app that is still running is exactly what the caller must not hear
    // `undone` about.
    expect(await launch.cancelLate()).toBe('undo-failed');
    await expect(
      server.invoke(
        {
          allocationId: allocation.allocationId,
          appHandleId: launched.appHandleId,
          invocation: { type: 'action' },
        },
        {},
      ),
    ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_APP_DIED });
  });
});

describe('the login discipline of the app port', () => {
  /**
   * @issue DTX-6156
   * The first frame of a connection must be the native's `login` (role
   * `'app'`), arriving on a URL whose nonce names a waiting launch, with
   * the session id that launch expects. Anything else is turned away —
   * this port has no anonymous uses. A valid nonce with no launch
   * waiting behind it (a stale redial, or something probing the port)
   * is refused the same way.
   */
  it('turns away a login nobody is expecting, a wrong role, and a non-login first frame', async () => {
    const gateway = await AppGateway.listen();
    gateways.push(gateway);

    const stray = dialApp(gateway.url, 'com.nobody.expects');
    await stray.closed;

    const wrongRole = new WebSocket(gateway.url);
    const wrongRoleClosed = new Promise<void>((resolve) =>
      wrongRole.addEventListener('close', () => resolve()),
    );
    wrongRole.addEventListener('open', () =>
      wrongRole.send(
        JSON.stringify({ type: 'login', messageId: 0, params: { sessionId: 'x', role: 'tester' } }),
      ),
    );
    await wrongRoleClosed;

    const eager = new WebSocket(gateway.url);
    const eagerClosed = new Promise<void>((resolve) =>
      eager.addEventListener('close', () => resolve()),
    );
    eager.addEventListener('open', () =>
      eager.send(JSON.stringify({ type: 'ready', messageId: -1000 })),
    );
    await eagerClosed;
  });

  it('the socket error sink is inert (see its doc comment for why it is called directly)', () => {
    expect(ignoreSocketError()).toBeUndefined();
  });

  it('hangs up on a frame the dialect cannot parse', async () => {
    const gateway = await AppGateway.listen();
    gateways.push(gateway);
    const socket = new WebSocket(gateway.url);
    const closed = new Promise<void>((resolve) => socket.addEventListener('close', () => resolve()));
    socket.addEventListener('open', () => socket.send('not json at all'));
    await closed;
  });

  it('accepts binary frames — that is what the real native sends', async () => {
    const gateway = await AppGateway.listen();
    gateways.push(gateway);
    const pending = gateway.expectApp({ udid: 'udid-1', sessionId: 'com.example.binary' });
    dialApp(pending.url, 'com.example.binary', { binary: true });
    const session = await pending.session;
    await session.ready;
    expect(session.dead).toBe(false);
  });

  /**
   * @issue DTX-6153
   * Same bundle id launched on two devices at once: session ids are
   * bundle ids, guessable and identical across devices running the same
   * app, so matching by session id alone would let two concurrent
   * launches cross their handles. The claim is keyed by the nonce each
   * launch was handed, so the app dialing in binds to its own launch —
   * whichever order the two connect in.
   */
  it('binds a login by the per-launch claim URL, never by session id alone', async () => {
    const gateway = await AppGateway.listen();
    gateways.push(gateway);
    const bundleId = 'com.example.same';
    const claimA = gateway.expectApp({ udid: 'udid-A', sessionId: bundleId });
    const claimB = gateway.expectApp({ udid: 'udid-B', sessionId: bundleId });
    expect(claimA.url).not.toBe(claimB.url);

    // B's process dials in FIRST — under session-id matching it would have
    // been handed A's (older) claim.
    dialApp(claimB.url, bundleId);
    const sessionB = await claimB.session;
    expect(sessionB.udid).toBe('udid-B');

    dialApp(claimA.url, bundleId);
    const sessionA = await claimA.session;
    expect(sessionA.udid).toBe('udid-A');

    // A stale process redialing an already-claimed URL is refused, not
    // crossed into someone else's launch.
    const stale = dialApp(claimA.url, bundleId);
    await stale.closed;

    // A squatter that guessed the session id but not the nonce is refused.
    const squatter = dialApp(`${gateway.url}/not-a-real-token`, bundleId);
    await squatter.closed;

    // A login whose session id does not match the claim behind the URL is
    // refused even with a valid nonce.
    const claimC = gateway.expectApp({ udid: 'udid-C', sessionId: 'com.example.other' });
    const liar = dialApp(claimC.url, bundleId);
    await liar.closed;
  });

  it('close() does not hang on a connected socket that never logs in', async () => {
    const gateway = await AppGateway.listen({ closeGraceMs: 50 });
    const silent = new WsClient(gateway.url);
    await new Promise<void>((resolve) => silent.once('open', () => resolve()));
    // A peer that never even processes the polite close: pause the stream so
    // the close handshake cannot complete — the grace timer must then
    // terminate it, or shutdown hangs forever.
    silent.pause();
    await gateway.close();
  });

  it('reaps a connection that never presents a login', async () => {
    const gateway = await AppGateway.listen({ loginDeadlineMs: 50 });
    gateways.push(gateway);
    const silent = new WsClient(gateway.url);
    const closed = new Promise<void>((resolve) => silent.once('close', () => resolve()));
    await new Promise<void>((resolve) => silent.once('open', () => resolve()));
    await closed;
  });

  it('an abruptly reset socket dies through the shared death path', async () => {
    const gateway = await AppGateway.listen();
    gateways.push(gateway);
    const pending = gateway.expectApp({ udid: 'udid-1', sessionId: 'com.example.rst' });
    const raw = new WsClient(pending.url);
    await new Promise<void>((resolve) => raw.once('open', () => resolve()));
    raw.send(
      JSON.stringify({ type: 'login', messageId: 0, params: { sessionId: 'com.example.rst', role: 'app' } }),
    );
    const session = await pending.session;
    // RST, not FIN — the most abrupt loss a client can inflict.
    const tcp = (raw as unknown as RawSocketCarrier)._socket;
    (tcp.resetAndDestroy ?? tcp.destroy).call(tcp);
    await vi.waitFor(() => expect(session.dead).toBe(true));
  });

  /**
   * @issue DTX-6152
   * A dying app sends both: the exception that explains the crash,
   * and then the signal handler's generic stack once `abort()` runs.
   * v20 kept the first (`Client.js:344`) and so does this — keeping
   * the last would replace "JS Exception: …" with "Signal 6 raised"
   * in every crash error.
   */
  it('keeps the FIRST crash report, not the last — the diagnosis, not the symptom', async () => {
    const gateway = await AppGateway.listen();
    gateways.push(gateway);
    const pending = gateway.expectApp({ udid: 'udid-1', sessionId: 'com.example.crash' });
    const raw = new WsClient(pending.url);
    await new Promise<void>((resolve) => raw.once('open', () => resolve()));
    raw.send(
      JSON.stringify({
        type: 'login',
        messageId: 0,
        params: { sessionId: 'com.example.crash', role: 'app' },
      }),
    );
    const session = await pending.session;
    for (const errorDetails of ['JS Exception: Simulating early crash', 'Signal 6 raised']) {
      raw.send(
        JSON.stringify({
          type: 'AppWillTerminateWithError',
          messageId: -10000,
          params: { errorDetails },
        }),
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
    raw.close();
    await vi.waitFor(() => expect(session.dead).toBe(true));
    await expect(session.invoke({ type: 'invoke' })).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_APP_DIED,
      details: { appReport: { errorDetails: 'JS Exception: Simulating early crash' } },
    });
  });

  it('a cancelled claim rejects and later logins find nothing', async () => {
    const gateway = await AppGateway.listen();
    gateways.push(gateway);
    const pending = gateway.expectApp({ udid: 'udid-1', sessionId: 'com.example.gone' });
    pending.cancel();
    await expect(pending.session).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_APP_DIED });
    const late = dialApp(pending.url, 'com.example.gone');
    await late.closed;
  });
});

interface Launched {
  app: FakeApp;
  allocation: AllocateResponse;
  handle: LaunchResponse;
  server: Awaited<ReturnType<typeof makeServer>>;
}

async function launched(): Promise<Launched> {
  let app!: FakeApp;
  const server = await makeServer({
    onLaunch: (url, bundleId) => {
      app = dialApp(url, bundleId);
    },
  });
  const allocation = await server.allocate({ type: 'ios.simulator' }, {});
  const handle = await server.launchApp(
    { allocationId: allocation.allocationId, appId: 'com.example.app' },
    {},
  );
  return { app, allocation, handle, server };
}

/** The next frame of `type` that arrives at (or after) index `from` — so a
 * repeated frame type can be awaited per-occurrence, not just first-match. */
const nextFrame = (app: FakeApp, type: string, from: number): Promise<Frame> =>
  app.waitFor((frame) => frame.type === type && app.received.indexOf(frame) >= from);

describe('the invoke channel', () => {

  /**
   * @issue DTX-2003
   * `invocation` is the frozen-dialect object, verbatim: the server relays
   * it as the `invoke` frame's params and never looks inside — no
   * reshaping, no validation of its contents.
   */
  it('relays the invocation verbatim, correlates by fresh increasing non-negative ids', async () => {
    const { app, allocation, handle, server } = await launched();
    const invocation = { type: 'action', action: 'tap', predicate: { type: 'text', value: 'x' } };

    const first = server.invoke(
      { allocationId: allocation.allocationId, appHandleId: handle.appHandleId, invocation },
      {},
    );
    const frame1 = await app.waitFor((frame) => frame.type === 'invoke');
    expect(frame1.params).toEqual(invocation);
    expect(Number.isInteger(frame1.messageId)).toBe(true);
    expect(frame1.messageId).toBeGreaterThanOrEqual(0);
    app.send({ type: 'invokeResult', messageId: frame1.messageId, params: { ok: true } });
    await expect(first).resolves.toEqual({ result: { ok: true } });

    const second = server.invoke(
      { allocationId: allocation.allocationId, appHandleId: handle.appHandleId, invocation },
      {},
    );
    const frame2 = await app.waitFor(
      (frame) => frame.type === 'invoke' && frame.messageId !== frame1.messageId,
    );
    expect(frame2.messageId).toBeGreaterThan(frame1.messageId);
    app.send({ type: 'testFailed', messageId: frame2.messageId, params: { details: 'nope' } });
    await expect(second).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_EXPECTATION_FAILED,
      details: { details: 'nope' },
    });
  });

  /**
   * @issue DTX-6149
   * Abort is abandonment: the caller is rejected, the app is sent
   * nothing because of it, the id is burned forever, and a late reply
   * lands on nothing.
   */
  it('abort abandons: nothing extra is sent, the id is burned, the late reply lands on nothing', async () => {
    const { app, allocation, handle, server } = await launched();
    const invocation = { type: 'action', action: 'tap', predicate: { type: 'text', value: 'x' } };

    const aborter = new AbortController();
    const tapping = server.invoke(
      { allocationId: allocation.allocationId, appHandleId: handle.appHandleId, invocation },
      { signal: aborter.signal },
    );
    const abandoned = await app.waitFor((frame) => frame.type === 'invoke');
    const framesBefore = app.received.length;
    aborter.abort(new Error('stopped waiting'));
    await expect(tapping).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_ABORTED });

    // The late reply must be dropped harmlessly.
    app.send({ type: 'invokeResult', messageId: abandoned.messageId, params: {} });

    const retap = server.invoke(
      { allocationId: allocation.allocationId, appHandleId: handle.appHandleId, invocation },
      {},
    );
    const fresh = await app.waitFor(
      (frame) => frame.type === 'invoke' && frame.messageId !== abandoned.messageId,
    );
    expect(fresh.messageId).toBeGreaterThan(abandoned.messageId);
    app.send({ type: 'invokeResult', messageId: fresh.messageId, params: {} });
    await retap;
    // Exactly one frame (the fresh invoke) since the abort.
    expect(app.received.length).toBe(framesBefore + 1);

    // An invoke whose signal is aborted BEFORE sending never reaches the app.
    const preAborted = new AbortController();
    preAborted.abort();
    await expect(
      server.invoke(
        { allocationId: allocation.allocationId, appHandleId: handle.appHandleId, invocation },
        { signal: preAborted.signal },
      ),
    ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_ABORTED });
    expect(app.received.length).toBe(framesBefore + 1);
  });

  it('a dying socket rejects the in-flight invoke and the handle stays dead — the device untouched', async () => {
    const { app, allocation, handle, server } = await launched();
    const invocation = { type: 'action', action: 'tap', predicate: { type: 'text', value: 'x' } };

    const tapping = server.invoke(
      { allocationId: allocation.allocationId, appHandleId: handle.appHandleId, invocation },
      {},
    );
    await app.waitFor((frame) => frame.type === 'invoke');
    app.close();
    await expect(tapping).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_APP_DIED });

    // The tombstone answers, permanently.
    await expect(
      server.invoke(
        { allocationId: allocation.allocationId, appHandleId: handle.appHandleId, invocation },
        {},
      ),
    ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_APP_DIED });

    // A handle id nobody minted gets the same liveness answer (after ownership).
    await expect(
      server.invoke(
        { allocationId: allocation.allocationId, appHandleId: 'never-issued', invocation },
        {},
      ),
    ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_APP_DIED });
    await expect(
      server.invoke({ allocationId: 'not-yours', appHandleId: handle.appHandleId, invocation }, {}),
    ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_STALE_HANDLE });
  });

  /**
   * @issue DTX-2014
   * `terminateApp` with a handle kills the OS process, actively closes that
   * handle's gateway session, and invalidates it — a second terminate
   * through the same handle hears `DETOX_APP_DIED`, never a repeat success.
   */
  it('terminate through the handle kills the process, closes the session, and tombstones the handle', async () => {
    const terminated: string[] = [];
    let app!: FakeApp;
    const server = await makeServer({
      onLaunch: (url, bundleId) => {
        app = dialApp(url, bundleId);
      },
      onTerminate: ({ bundleId }) => terminated.push(bundleId),
    });
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    const handle = await server.launchApp(
      { allocationId: allocation.allocationId, appId: 'com.example.app' },
      {},
    );
    terminated.length = 0; // nothing so far (clean boot skips terminate-first) — but stay robust to that changing

    await server.terminateApp(
      { allocationId: allocation.allocationId, appHandleId: handle.appHandleId },
      {},
    );
    expect(terminated).toEqual(['com.example.app']);
    await app.closed;

    await expect(
      server.terminateApp(
        { allocationId: allocation.allocationId, appHandleId: handle.appHandleId },
        {},
      ),
    ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_APP_DIED });
  });

  it('release closes the allocation’s app sessions', async () => {
    const { app, allocation, server } = await launched();
    await server.release({ allocationId: allocation.allocationId }, {});
    await app.closed;
  });

  it('release closes even a session whose launch completed DURING the reclaim barrier', async () => {
    let app!: FakeApp;
    let openGate!: () => void;
    const gate = new Promise<void>((resolve) => {
      openGate = resolve;
    });
    const server = await makeServer({
      launchGate: gate,
      onLaunch: (url, bundleId) => {
        app = dialApp(url, bundleId);
      },
    });
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    const launching = server.launchApp(
      { allocationId: allocation.allocationId, appId: 'com.example.app' },
      {},
    );
    const releasing = server.release({ allocationId: allocation.allocationId }, {});
    openGate();
    await launching;
    await releasing;
    // The session registered mid-barrier must not survive its allocation.
    await app.closed;
  });

  it('a launch finishing into a dead connection unwinds instead of stranding the app', async () => {
    let app!: FakeApp;
    const terminated: string[] = [];
    const server = await makeServer({
      onLaunch: (url, bundleId) => {
        app = dialApp(url, bundleId, { markReady: false });
      },
      onTerminate: ({ bundleId }) => terminated.push(bundleId),
    });
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    const launching = server.launchApp(
      { allocationId: allocation.allocationId, appId: 'com.example.app' },
      {},
    );
    await vi.waitFor(() =>
      expect(app.received.some((frame) => frame.type === 'isReady')).toBe(true),
    );
    // The tester connection dies while the app is mid-handshake…
    server.impl.release();
    // …and the app then reports ready into a launch nobody will hear about.
    app.send({ type: 'ready', messageId: -1000 });
    await expect(launching).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_ABORTED });
    await app.closed;
    // No terminate-first (clean server boot) — the one call is the unwind's
    // compensation.
    await vi.waitFor(() => expect(terminated.length).toBe(1));
  });

  it('refuses a non-object invocation before it can crash the app', async () => {
    const { app, allocation, handle, server } = await launched();
    const framesBefore = app.received.length;
    await expect(
      server.invoke(
        {
          allocationId: allocation.allocationId,
          appHandleId: handle.appHandleId,
          invocation: 'tap' as never,
        },
        {},
      ),
    ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_INVALID_ARGUMENT });
    expect(app.received.length).toBe(framesBefore);
  });
});

describe('the reload channel (reactNativeReload)', () => {
  it('relays the frozen reload frame with the sentinel id and resolves on the app’s NEXT ready', async () => {
    const { app, allocation, handle, server } = await launched();
    const address = { allocationId: allocation.allocationId, appHandleId: handle.appHandleId };

    const first = server.reloadReactNative(address, {});
    const frame = await app.waitFor((f) => f.type === 'reactNativeReload');
    expect(frame.messageId).toBe(-1000);
    expect(frame.params).toEqual({});
    app.send({ type: 'ready', messageId: -1000 });
    await expect(first).resolves.toBeUndefined();

    // A second reload is NOT satisfied by any ready that already happened
    // (the launch handshake's, the first reload's) — only by a fresh one.
    const second = server.reloadReactNative(address, {});
    await nextFrame(app, 'reactNativeReload', app.received.length);
    let settled = false;
    void second.finally(() => {
      settled = true;
    });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(settled).toBe(false);
    app.send({ type: 'ready', messageId: -1000 });
    await expect(second).resolves.toBeUndefined();
  });

  it('abort abandons the wait: nothing extra is sent, a later ready lands on nothing', async () => {
    const { app, allocation, handle, server } = await launched();
    const address = { allocationId: allocation.allocationId, appHandleId: handle.appHandleId };

    const aborter = new AbortController();
    const reloading = server.reloadReactNative(address, { signal: aborter.signal });
    await app.waitFor((f) => f.type === 'reactNativeReload');
    const framesBefore = app.received.length;
    aborter.abort(new Error('stopped waiting'));
    await expect(reloading).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_ABORTED });
    // Abandonment means the app was told NOTHING because of the abort.
    expect(app.received.length).toBe(framesBefore);

    // The stray ready must land on nothing, harmlessly. A round-trip invoke
    // AFTER it proves the server processed it (frames on one socket are
    // ordered) and the session survived.
    app.send({ type: 'ready', messageId: -1000 });
    const invocation = { type: 'action', action: 'tap', predicate: { type: 'text', value: 'x' } };
    const roundTrip = server.invoke({ ...address, invocation }, {});
    const inv = await app.waitFor((f) => f.type === 'invoke');
    app.send({ type: 'invokeResult', messageId: inv.messageId, params: {} });
    await roundTrip;

    // The channel is healthy: a fresh reload still works end to end.
    const again = server.reloadReactNative(address, {});
    await nextFrame(app, 'reactNativeReload', app.received.length);
    app.send({ type: 'ready', messageId: -1000 });
    await expect(again).resolves.toBeUndefined();

    // A pre-aborted signal sends nothing at all.
    const preAborted = new AbortController();
    preAborted.abort();
    const sentBefore = app.received.length;
    await expect(
      server.reloadReactNative(address, { signal: preAborted.signal }),
    ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_ABORTED });
    expect(app.received.length).toBe(sentBefore);
  });

  it('two concurrent reloads settle strictly one per ready, in order', async () => {
    const { app, allocation, handle, server } = await launched();
    const address = { allocationId: allocation.allocationId, appHandleId: handle.appHandleId };

    const first = server.reloadReactNative(address, {});
    const second = server.reloadReactNative(address, {});
    await nextFrame(app, 'reactNativeReload', 0);
    let firstSettled = false;
    let secondSettled = false;
    void first.finally(() => {
      firstSettled = true;
    });
    void second.finally(() => {
      secondSettled = true;
    });

    app.send({ type: 'ready', messageId: -1000 });
    await first;
    expect(firstSettled).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(secondSettled).toBe(false);

    app.send({ type: 'ready', messageId: -1000 });
    await expect(second).resolves.toBeUndefined();
  });

  /**
   * @issue DTX-6148
   * Abort is abandonment: the frame is already sent and the app is
   * told nothing, but the ledger entry stays as a tombstone (waiter
   * cleared, position kept) — the abandoned reload's frame is still
   * with the app, and its eventual ready must be swallowed by the
   * tombstone rather than crediting a later call.
   */
  it('an aborted reload’s owed ready is swallowed, never credited to the next reload', async () => {
    const { app, allocation, handle, server } = await launched();
    const address = { allocationId: allocation.allocationId, appHandleId: handle.appHandleId };

    const aborter = new AbortController();
    const abandoned = server.reloadReactNative(address, { signal: aborter.signal });
    await app.waitFor((f) => f.type === 'reactNativeReload');
    aborter.abort(new Error('stopped waiting'));
    await expect(abandoned).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_ABORTED });

    const fresh = server.reloadReactNative(address, {});
    await nextFrame(app, 'reactNativeReload', app.received.length);
    let freshSettled = false;
    void fresh.finally(() => {
      freshSettled = true;
    });
    app.send({ type: 'ready', messageId: -1000 }); // owed to the abandoned reload
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(freshSettled).toBe(false);

    app.send({ type: 'ready', messageId: -1000 }); // the fresh reload's own
    await expect(fresh).resolves.toBeUndefined();
  });

  /**
   * @issue DTX-2000
   * Every app action checks device ownership before app-handle liveness: a
   * released allocation answers `DETOX_STALE_HANDLE` even for a handle that
   * was live moments ago, never `DETOX_APP_DIED` — ownership is the outer
   * gate, uniform with spec 005.
   */
  it('checks in the uniform order: ownership, then handle liveness, then the wire', async () => {
    const { allocation, handle, server } = await launched();
    const address = { allocationId: allocation.allocationId, appHandleId: handle.appHandleId };

    // A missing appHandleId is refused as an argument, not guessed at.
    await expect(
      server.reloadReactNative({ allocationId: allocation.allocationId, appHandleId: '' }, {}),
    ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_INVALID_ARGUMENT });

    // A terminated handle is a tombstone: reload answers app-died forever.
    await server.terminateApp(address, {});
    await expect(server.reloadReactNative(address, {})).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_APP_DIED,
    });

    // After release, ownership fails FIRST — stale handle, not app-died.
    await server.release({ allocationId: allocation.allocationId }, {});
    await expect(server.reloadReactNative(address, {})).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_STALE_HANDLE,
    });
  });

  it('a dying socket rejects the in-flight reload and the handle stays dead', async () => {
    const { app, allocation, handle, server } = await launched();
    const address = { allocationId: allocation.allocationId, appHandleId: handle.appHandleId };

    const reloading = server.reloadReactNative(address, {});
    await app.waitFor((f) => f.type === 'reactNativeReload');
    app.close();
    await expect(reloading).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_APP_DIED });
    await expect(server.reloadReactNative(address, {})).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_APP_DIED,
    });
  });
});
