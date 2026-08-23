import { describe, it, expect, vi } from 'vitest';
import type { DeviceInfo } from '@detox-remote/protocol';
import { DetoxErrorCode } from '@detox-remote/core';

import { DetoxServerImpl } from '../DetoxServerImpl';
import { DevicePool } from '../DevicePool';
import type { DetoxServerPeer } from '../DetoxServerPeer';
import type {
  SimulatorOps,
  BootArgs,
  DeviceTargetArgs,
  InstallAppArgs,
  LaunchAppArgs,
  TerminateAppArgs,
  CreatableQueryArgs,
  CreatableDeviceType,
  CreateDeviceArgs,
  RawDeviceListing,
} from '../SimulatorOps';

type UndoFn = () => void | Promise<void>;

interface HandlerCtx {
  signal?: AbortSignal;
  progress?: (value: unknown) => void;
  onUndo?: (fn: UndoFn) => void;
}

type Handler<P, R> = (params: P, ctx: HandlerCtx) => Promise<R>;

interface StateNotification {
  allocationId: string;
  state: string;
}

interface CapturedPeer {
  peer: DetoxServerPeer;
  handlers: Map<string, Handler<never, unknown>>;
  stateNotifications: StateNotification[];
}

/**
 * Captures *every* handler `DetoxServerImpl` registers, keyed by wire method
 * name (`onBootDevice` -> `bootDevice`), plus every `deviceStateChanged`
 * push. A generalization of the single-method `capturingPeer` helpers in
 * device-actions.test.ts / cancellation.test.ts: those only capture the one
 * or two methods each file exercises, but this file's job is the long tail
 * neither of them touches (boot/shutdown/install/terminate direct calls, the
 * not-implemented stubs, the terminal-release reclaim barrier).
 */
function capturingPeer(): CapturedPeer {
  const handlers = new Map<string, Handler<never, unknown>>();
  const stateNotifications: StateNotification[] = [];
  const peer = new Proxy(
    {},
    {
      get: (_target, prop: string) => {
        if (prop === 'notifyDeviceStateChanged') {
          return (payload: StateNotification) => stateNotifications.push(payload);
        }
        if (prop.startsWith('on')) {
          const key = prop[2].toLowerCase() + prop.slice(3);
          return (handler: Handler<never, unknown>) => handlers.set(key, handler);
        }
        // notifyX (other than deviceStateChanged) and anything else — irrelevant here.
        return () => {};
      },
    },
  ) as DetoxServerPeer;
  return { peer, handlers, stateNotifications };
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

interface RawDevicesArgs {
  signal?: AbortSignal;
}

interface OpsOverrides {
  devices?: DeviceInfo[];
  boot?: (args: BootArgs) => Promise<boolean>;
  shutdown?: (args: DeviceTargetArgs) => Promise<boolean>;
  launch?: (args: LaunchAppArgs) => Promise<number>;
  terminate?: (args: TerminateAppArgs) => Promise<void>;
  install?: (args: InstallAppArgs) => Promise<void>;
  creatableDeviceType?: (args: CreatableQueryArgs) => Promise<CreatableDeviceType | undefined>;
  create?: (args: CreateDeviceArgs) => Promise<string>;
  rawDevices?: (args: RawDevicesArgs) => Promise<RawDeviceListing[]>;
}

/** A single warm, shutdown iPhone by default — every field overridable per test. */
function fakeSimulatorOps(overrides: OpsOverrides = {}): SimulatorOps {
  const devices: DeviceInfo[] =
    overrides.devices ??
    ([{ name: 'iPhone 17', udid: 'udid-1', state: 'Shutdown', os: { platform: 'iOS' } }] as DeviceInfo[]);
  return {
    list: async () => devices,
    boot: overrides.boot ?? (async () => true),
    shutdown: overrides.shutdown ?? (async () => true),
    launch: overrides.launch ?? (async () => 1),
    terminate: overrides.terminate ?? (async () => undefined),
    install: overrides.install ?? (async () => undefined),
    sendToHome: async () => undefined,
    creatableDeviceType: overrides.creatableDeviceType ?? (async () => undefined),
    create:
      overrides.create ??
      (async () => {
        throw new Error('create() was not configured for this fake');
      }),
    rawDevices: overrides.rawDevices ?? (async () => []),
    deleteDevice: async () => undefined,
  } as unknown as SimulatorOps;
}

interface ServerHandle {
  impl: DetoxServerImpl;
  devicePool: DevicePool;
  handlers: Map<string, Handler<never, unknown>>;
  stateNotifications: StateNotification[];
}

function makeServer(overrides: OpsOverrides = {}): ServerHandle {
  const simulatorOps = fakeSimulatorOps(overrides);
  const devicePool = new DevicePool({ simulatorOps, maxPool: 4 });
  const captured = capturingPeer();
  const impl = new DetoxServerImpl({
    serverPeer: captured.peer,
    devicePool,
    simulatorOps,
  });
  return { impl, devicePool, handlers: captured.handlers, stateNotifications: captured.stateNotifications };
}

interface AllocateParams {
  type: string;
  device?: { type?: string };
}

interface AllocateResponse {
  allocationId: string;
  device: { udid: string };
}

async function expectNotImplemented(
  handlers: Map<string, Handler<never, unknown>>,
  method: string,
  allocationId: string,
): Promise<void> {
  const handler = handlers.get(method);
  if (!handler) throw new Error(`${method} handler was never registered`);
  await expect(handler({ allocationId } as never, {})).rejects.toMatchObject({
    code: DetoxErrorCode.DETOX_NOT_IMPLEMENTED,
    details: { method },
  });
}

describe('the boot heartbeat', () => {
  /**
   * @issue DTX-6000
   * `BOOT_HEARTBEAT_MS` (10 s) is well under the relay's 30 s per-attempt
   * stall window: a real dual cold boot measures ~50 s on a loaded Mac, and
   * silence for the whole window is indistinguishable from a wedge to
   * anything watching liveness. Two beats by 25 s is the contract that keeps
   * a slow boot's silence separable from a dead one.
   */
  it('a slow cold boot narrates every 10 s, so a relay stall detector sees liveness instead of silence', async () => {
    vi.useFakeTimers();
    try {
      let finishBoot!: () => void;
      const server = makeServer({
        boot: async ({ onBootStart }) => {
          onBootStart?.();
          await new Promise<void>((resolve) => {
            finishBoot = resolve;
          });
          return true;
        },
      });
      const allocate = call<AllocateParams, AllocateResponse>(server.handlers, 'allocateDevice');
      const progressMessages: string[] = [];
      const pending = allocate(
        { type: 'ios.simulator' },
        { progress: (v) => progressMessages.push(JSON.stringify(v)) },
      );
      await vi.advanceTimersByTimeAsync(25_000);
      expect(progressMessages.filter((m) => m.includes('Still booting'))).toHaveLength(2);
      finishBoot();
      await vi.runAllTimersAsync();
      await pending;
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('bootDevice / shutdownDevice — direct handlers', () => {
  it('boots and shuts down the named device, pushing state through the notifier both times', async () => {
    const bootCalls: string[] = [];
    const shutdownCalls: string[] = [];
    const server = makeServer({
      boot: async ({ udid, onBootStart }) => {
        bootCalls.push(udid);
        // A real cold boot always narrates its start — exercised here the
        // same way SimulatorOps.boot exercises it for real.
        onBootStart?.();
        return true;
      },
      shutdown: async ({ udid }) => {
        shutdownCalls.push(udid);
        return true;
      },
    });
    const allocate = call<AllocateParams, AllocateResponse>(server.handlers, 'allocateDevice');
    const boot = call<{ allocationId: string }, { state: string }>(server.handlers, 'bootDevice');
    const shutdown = call<{ allocationId: string }, { state: string }>(server.handlers, 'shutdownDevice');

    const progressMessages: string[] = [];
    const allocation = await allocate(
      { type: 'ios.simulator' },
      { progress: (v) => progressMessages.push(JSON.stringify(v)) },
    );
    // Allocation itself performs a real cold boot on this cold-shutdown fixture.
    expect(bootCalls).toEqual(['udid-1']);
    expect(progressMessages.some((m) => m.includes('"kind":"begin"'))).toBe(true);

    const bootResult = await boot({ allocationId: allocation.allocationId }, {});
    expect(bootResult).toEqual({ state: 'booted' });
    expect(bootCalls).toEqual(['udid-1', 'udid-1']);

    const shutdownResult = await shutdown({ allocationId: allocation.allocationId }, {});
    expect(shutdownResult).toEqual({ state: 'shutdown' });
    expect(shutdownCalls).toEqual(['udid-1']);

    // The push channel is the sole writer of device.state (spec 002's
    // two-writers fix) — both direct calls must have driven it, not just the
    // allocate response.
    expect(server.stateNotifications).toEqual([
      { allocationId: allocation.allocationId, state: 'booted' },
      { allocationId: allocation.allocationId, state: 'shutdown' },
    ]);
  });

  it('refuses an unknown allocationId with the typed stale-handle error', async () => {
    const server = makeServer();
    const boot = call<{ allocationId: string }, { state: string }>(server.handlers, 'bootDevice');
    const shutdown = call<{ allocationId: string }, { state: string }>(server.handlers, 'shutdownDevice');

    await expect(boot({ allocationId: 'nope' }, {})).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_STALE_HANDLE,
    });
    await expect(shutdown({ allocationId: 'nope' }, {})).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_STALE_HANDLE,
    });
  });
});

describe('installApp / terminateApp — direct handlers', () => {
  /**
   * @issue DTX-6032
   * Spec 007: the wire takes exactly one of `appPath` (URL form) and `blob`,
   * and the interim "server reads my filesystem path" transport is dead — a
   * bare path is a version-skewed client, answered instructively, never by
   * reading this machine's disk. Ownership still precedes everything, and
   * the handler *rejects* rather than throws, like every sibling.
   */
  it('installApp: params are exclusive and the interim server-read path is dead', async () => {
    const installs: string[] = [];
    const server = makeServer({
      install: async ({ appPath }) => {
        installs.push(appPath);
      },
    });
    const allocate = call<AllocateParams, AllocateResponse>(server.handlers, 'allocateDevice');
    const install = call<
      { allocationId: string; appPath?: string; blob?: { algo: string; hex: string } },
      void
    >(server.handlers, 'installApp');

    const allocation = await allocate({ type: 'ios.simulator' }, {});

    // Neither form → the caller's mistake, typed. No async wrapper here on
    // purpose: the handler must return a rejected promise, never throw
    // synchronously at its call site.
    await expect(install({ allocationId: allocation.allocationId }, {})).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
      details: { method: 'installApp' },
    });
    // Both forms → same refusal: the params are exclusive by contract.
    await expect(
      install(
        {
          allocationId: allocation.allocationId,
          appPath: 'http://example.com/App.zip',
          blob: { algo: 'sha256', hex: 'a'.repeat(64) },
        },
        {},
      ),
    ).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
      details: { method: 'installApp' },
    });
    // A non-URL string used to mean "read my disk"; now it means version
    // skew, and the message must say so instead of pointing at the disk.
    await expect(
      install({ allocationId: allocation.allocationId, appPath: '/tmp/App.app' }, {}),
    ).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
      message: expect.stringContaining('older than the server') as unknown as string,
    });
    // Nothing above ever reached simctl.
    expect(installs).toEqual([]);
    // A stale handle still hears stale-handle first, not the transport story.
    await expect(
      install({ allocationId: 'not-yours', appPath: '/tmp/App.app' }, {}),
    ).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_STALE_HANDLE,
    });
  });

  /**
   * The URL form (spec 003) survives spec 007 untouched
   * and is really dereferenced: an unreachable URL fails with a transfer
   * error — proof the fetch genuinely ran — and install never fires.
   */
  it('installApp still ACCEPTS a URL, and really fetches it', async () => {
    const installs: string[] = [];
    const server = makeServer({
      install: async ({ appPath }) => {
        installs.push(appPath);
      },
    });
    const allocate = call<AllocateParams, AllocateResponse>(server.handlers, 'allocateDevice');
    const install = call<{ allocationId: string; appPath?: string }, void>(
      server.handlers,
      'installApp',
    );
    const allocation = await allocate({ type: 'ios.simulator' }, {});
    await expect(
      install(
        { allocationId: allocation.allocationId, appPath: 'http://127.0.0.1:9/App.zip' },
        {},
      ),
    ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_APP_TRANSFER_FAILED });
    // The fetch failed before any real bundle existed, so install never ran.
    expect(installs).toEqual([]);
  });

  it('terminateApp routes to the device the allocation names', async () => {
    const terminateCalls: Array<{ udid: string; bundleId: string }> = [];
    const server = makeServer({
      terminate: async ({ udid, bundleId }) => {
        terminateCalls.push({ udid, bundleId });
      },
    });
    const allocate = call<AllocateParams, AllocateResponse>(server.handlers, 'allocateDevice');
    const terminate = call<{ allocationId: string; appId: string }, void>(server.handlers, 'terminateApp');

    const allocation = await allocate({ type: 'ios.simulator' }, {});
    await terminate({ allocationId: allocation.allocationId, appId: 'com.example.app' }, {});

    expect(terminateCalls).toEqual([{ udid: allocation.device.udid, bundleId: 'com.example.app' }]);
  });
});

describe('every declared-but-unwired device action', () => {
  /**
   * What remains unwired after spec 003 pulled `installApp` in: the two
   * Android port-reversal verbs, screenshots (the artifacts spec owns
   * transport), and every app-channel verb 003 left out.
   */
  const stillUnwired = [
    'takeScreenshot',
    'reverseTcpPort',
    'unreverseTcpPort',
    // 'reloadReactNative' left this list — wired for the parity corpus
    // (app-gateway.test.ts owns its behaviour now).
    // 'waitForBackground' / 'waitForActive' / 'deliverPayload' left with
    // spec 006 (launch-options.test.ts owns their behaviour now).
    'shake',
    'setOrientation',
    // 'setSyncSettings' left this list — wired for the parity corpus
    // (waitFor/sync work; its handler test lives beside the other
    // app-channel verbs).
    'currentStatus',
    'captureViewHierarchy',
    'generateViewHierarchyXml',
  ];

  /**
   * @issue DTX-6003
   * No silent half-implementation (a frozen project constraint): a
   * contract method no spec has wired yet answers with a
   * typed `DETOX_NOT_IMPLEMENTED` refusal naming itself, never the raw
   * JSON-RPC -32601 a client would misfile as "the server broke its own
   * protocol".
   */
  it('answers a typed refusal naming itself, never a raw method-not-found', async () => {
    const server = makeServer();
    const allocate = call<AllocateParams, AllocateResponse>(server.handlers, 'allocateDevice');
    const allocation = await allocate({ type: 'ios.simulator' }, {});
    for (const method of stillUnwired) {
      await expectNotImplemented(server.handlers, method, allocation.allocationId);
    }
  });

  /**
   * @issue DTX-6004
   * Ownership precedes implementedness — spec 005 rules the order once for
   * every device action, through the same `_deviceAction` path every wired
   * verb uses. Without it, a stale handle and an unbuilt method would be
   * indistinguishable, and the code a stale caller saw would flip the day
   * the method got wired.
   */
  it('checks ownership before implementedness, so a stale handle is never mistaken for an unbuilt verb', async () => {
    const server = makeServer();
    for (const method of stillUnwired) {
      const handler = server.handlers.get(method);
      if (!handler) throw new Error(`${method} handler was never registered`);
      await expect(handler({ allocationId: 'not-yours' } as never, {})).rejects.toMatchObject({
        code: DetoxErrorCode.DETOX_STALE_HANDLE,
      });
    }
  });
});

describe('a dead connection reclaims what it holds only once in-flight work settles', () => {
  /**
   * @issue DTX-6002
   * `release()` (the socket died — terminal) delegates to `releaseAll()`,
   * which must honor the same reclaim barrier `_handleReleaseDevice` does
   * (device-actions.test.ts covers that explicit-release path): a udid is
   * never handed to the next allocation while a tracked operation on it is
   * still running.
   */
  it('does not free the device until its in-flight terminateApp settles', async () => {
    let openGate!: () => void;
    const gate = new Promise<void>((resolve) => {
      openGate = resolve;
    });
    const server = makeServer({
      terminate: async () => {
        await gate;
      },
    });
    const allocate = call<AllocateParams, AllocateResponse>(server.handlers, 'allocateDevice');
    const terminateApp = call<{ allocationId: string; appId: string }, void>(
      server.handlers,
      'terminateApp',
    );

    const allocation = await allocate({ type: 'ios.simulator' }, {});
    const terminating = terminateApp(
      { allocationId: allocation.allocationId, appId: 'com.example.app' },
      {},
    );

    server.impl.release();
    // Give the (wrongly) instant reclaim every chance to have happened.
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(server.devicePool.busyCount).toBe(1);

    openGate();
    await terminating;
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(server.devicePool.busyCount).toBe(0);
  });
});

describe('a non-simulator device type', () => {
  /**
   * @issue DTX-6011
   * Only `ios.simulator` has a backing pool on this server (retires defect
   * 10 — an `android` query used to be answered with an iOS device typed as
   * android). Every other declared type builds an empty query and is
   * filtered out entirely, landing on the terminal no-match refusal —
   * never a guess.
   */
  it('is refused as no-matching-device, never silently matched against the iOS fleet', async () => {
    const server = makeServer();
    const allocate = call<AllocateParams, AllocateResponse>(server.handlers, 'allocateDevice');

    await expect(allocate({ type: 'android.emulator' }, {})).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_NO_MATCHING_DEVICE,
    });
  });
});

describe('rolling back a device this allocation created', () => {
  /**
   * A half-made leftover of a cancelled/failed creation is always deleted,
   * never merely released — and the compensating shutdown
   * attempt is best-effort: its own failure must not stop the discard.
   */
  it('discards the created device even when both the boot and its compensating shutdown fail', async () => {
    const shutdownAttempts: string[] = [];
    const server = makeServer({
      devices: [],
      creatableDeviceType: async () => ({
        deviceTypeIdentifier: 'com.apple.CoreSimulator.SimDeviceType.iPhone-17',
        runtime: {
          identifier: 'com.apple.CoreSimulator.SimRuntime.iOS-26-5',
          name: 'iOS 26.5',
          version: '26.5',
        },
      }),
      create: async () => 'new-udid',
      // No leftovers found on the ground — the detached rollback settles instantly.
      rawDevices: async () => [],
      boot: async () => {
        throw new Error('boot exploded');
      },
      shutdown: async ({ udid }) => {
        shutdownAttempts.push(udid);
        throw new Error('shutdown exploded too');
      },
    });
    const allocate = call<AllocateParams, AllocateResponse>(server.handlers, 'allocateDevice');

    await expect(allocate({ type: 'ios.simulator', device: { type: 'iPhone 17' } }, {})).rejects.toThrow(
      'boot exploded',
    );

    expect(shutdownAttempts).toEqual(['new-udid']);
    // Dropped from the registry synchronously — the detached delete retry
    // is fire-and-forget from the caller's point of view.
    expect(server.devicePool.busyCount).toBe(0);
  });
});
