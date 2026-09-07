/**
 * The server half of spec 005: routing, refusal order, and the wipe's
 * choreography.
 *
 * What the accept suite cannot reach from the public dialect lives here — the
 * never-kill-erase rule (erase finishes in well under a second on a real
 * simulator, so no public-dialect test can land an abort inside it) and the
 * wedged-erase outcome (nothing can wedge CoreSimulator on demand). Both are
 * contract, and both are invisible to `yarn accept 005`.
 */
import { describe, it, expect, afterEach } from 'vitest';
import type { DeviceInfo } from '@detox-remote/driver-ios';
import { DetoxErrorCode, DeviceUnknownStateError } from '@detox-remote/core';

import { DetoxServerImpl } from '../DetoxServerImpl';
import type { DetoxServerPeer } from '../DetoxServerPeer';
import { iosHost, iosPool, type IosHost } from './_ios-harness';

/** Every driver host a test builds (spec 015): closed after each so its per-device gateways release. */
const duHosts: IosHost[] = [];
afterEach(async () => {
  for (const host of duHosts.splice(0)) await host.close().catch(() => undefined);
});
import type {
  BiometricMatchArgs,
  DeviceTargetArgs,
  EraseArgs,
  OpenUrlArgs,
  SetBiometricEnrollmentArgs,
  SetLocationArgs,
  SetStatusBarArgs,
  SimulatorOps,
  UninstallAppArgs,
} from '@detox-remote/driver-ios';

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

/** Same capturing Proxy idiom as `DetoxServerImpl-coverage.test.ts`. */
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

/** The `{udid, signal}` pair the fake's recorders destructure. */
interface TargetedArgs {
  udid: string;
  signal?: AbortSignal;
}

interface FakeBootArgs extends TargetedArgs {
  onBootStart?: () => void;
}

/** One `$/progress` value, as the wire spells it. */
interface WireProgress {
  op: string;
  kind: string;
  message?: string;
  /** Only on `kind: 'end'` — how the bracketed child operation finished. */
  ok?: boolean;
}

/** A promise the test opens and closes by hand, standing in for a slow erase. */
interface Gate {
  promise: Promise<void>;
  resolve: () => void;
  reject: (err: Error) => void;
}

/**
 * Reads a `signal` off an argument object that, by design, has no such field:
 * `EraseArgs` deliberately cannot carry one (never-kill-erase), and this is how
 * a test asserts that a future edit did not quietly add it back.
 */
function signalOf(args: object): AbortSignal | undefined {
  return (args as TargetedArgs).signal;
}

/** Every utility call the fake received, in order — the routing ground truth. */
interface RecordedCall {
  verb: string;
  udid: string;
  detail?: unknown;
  signal?: AbortSignal;
}

interface OpsOverrides {
  devices?: DeviceInfo[];
  erase?: (args: EraseArgs) => Promise<void>;
  /** Answers `false` for "it was already cold", or throws to fail the leg. */
  shutdown?: (args: DeviceTargetArgs) => Promise<boolean>;
  boot?: (args: FakeBootArgs) => Promise<boolean>;
}

interface FakeOps {
  simulatorOps: SimulatorOps;
  calls: RecordedCall[];
}

function fakeSimulatorOps(overrides: OpsOverrides = {}): FakeOps {
  const calls: RecordedCall[] = [];
  const devices: DeviceInfo[] =
    overrides.devices ??
    ([{ name: 'iPhone 17', udid: 'udid-1', state: 'Shutdown', os: { platform: 'iOS' } }] as DeviceInfo[]);
  const record =
    (verb: string) =>
    ({ udid, signal }: TargetedArgs, detail?: unknown): void => {
      calls.push({ verb, udid, detail, signal });
    };
  const simulatorOps = {
    list: async () => devices,
    boot:
      overrides.boot ??
      (async ({ udid, signal, onBootStart }: FakeBootArgs) => {
        onBootStart?.();
        calls.push({ verb: 'boot', udid, signal });
        return true;
      }),
    shutdown:
      overrides.shutdown ??
      (async (args: DeviceTargetArgs) => {
        record('shutdown')(args);
        return true;
      }),
    launch: async () => 1,
    terminate: async () => undefined,
    sendToHome: async () => undefined,
    creatableDeviceType: async () => undefined,
    create: async () => {
      throw new Error('create() was not configured for this fake');
    },
    rawDevices: async () => [],
    deleteDevice: async () => undefined,
    uninstall: async (args: UninstallAppArgs) => {
      record('uninstall')(args, args.bundleId);
    },
    openUrl: async (args: OpenUrlArgs) => {
      record('openUrl')(args, args.url);
    },
    setLocation: async (args: SetLocationArgs) => {
      record('setLocation')(args, { lat: args.lat, lon: args.lon });
    },
    setStatusBar: async (args: SetStatusBarArgs) => {
      record('setStatusBar')(args, args.overrides);
    },
    resetStatusBar: async (args: DeviceTargetArgs) => {
      record('resetStatusBar')(args);
    },
    clearKeychain: async (args: DeviceTargetArgs) => {
      record('clearKeychain')(args);
    },
    setBiometricEnrollment: async (args: SetBiometricEnrollmentArgs) => {
      record('setBiometricEnrollment')(args, args.enabled);
    },
    matchBiometric: async (args: BiometricMatchArgs) => {
      record('matchBiometric')(args, { kind: args.kind, matched: args.matched });
    },
    erase:
      overrides.erase ??
      (async (args: EraseArgs) => {
        calls.push({ verb: 'erase', udid: args.udid, signal: signalOf(args) });
      }),
  } as unknown as SimulatorOps;
  return { simulatorOps, calls };
}

interface AllocateParams {
  type: string;
}

interface AllocateResponse {
  allocationId: string;
  device: { udid: string };
}

function makeServer(overrides: OpsOverrides = {}) {
  const ops = fakeSimulatorOps(overrides);
  const host = iosHost(ops.simulatorOps);
  duHosts.push(host);
  const devicePool = host.pool;
  const captured = capturingPeer();
  new DetoxServerImpl({ serverPeer: captured.peer, driverHost: host.host });
  return {
    ...ops,
    devicePool,
    handlers: captured.handlers,
    stateNotifications: captured.stateNotifications,
    allocate: call<AllocateParams, AllocateResponse>(captured.handlers, 'allocateDevice'),
    utility: <P>(method: string) => call<P, void>(captured.handlers, method),
  };
}

/** Every quick utility, with the params a happy call would carry. */
const QUICK_UTILITIES = [
  ['uninstallApp', { appId: 'com.example.doomed' }, 'uninstall'],
  ['openURL', { url: 'https://example.com/x' }, 'openUrl'],
  ['setLocation', { lat: 32.0853, lon: 34.7818 }, 'setLocation'],
  ['setStatusBar', { time: '12:34' }, 'setStatusBar'],
  ['resetStatusBar', {}, 'resetStatusBar'],
  ['setBiometricEnrollment', { enabled: true }, 'setBiometricEnrollment'],
  ['matchFace', {}, 'matchBiometric'],
  ['unmatchFace', {}, 'matchBiometric'],
  ['matchFinger', {}, 'matchBiometric'],
  ['unmatchFinger', {}, 'matchBiometric'],
  ['clearKeychain', {}, 'clearKeychain'],
] as const;

describe('the utilities are addressed by the registry, never by the device', () => {
  it('lands each verb on the device its allocation names, when the session holds two', async () => {
    const server = makeServer({
      devices: [
        { name: 'iPhone 17', udid: 'udid-1', state: 'Shutdown', os: { platform: 'iOS' } },
        { name: 'iPhone 17', udid: 'udid-2', state: 'Shutdown', os: { platform: 'iOS' } },
      ] as DeviceInfo[],
    });
    const first = await server.allocate({ type: 'ios.simulator' }, {});
    const second = await server.allocate({ type: 'ios.simulator' }, {});
    expect(first.device.udid).not.toBe(second.device.udid);

    for (const [method, params] of QUICK_UTILITIES) {
      server.calls.length = 0;
      await server.utility(method)({ allocationId: second.allocationId, ...params }, {});
      expect(server.calls.map((c) => c.udid)).toEqual([second.device.udid]);
    }
  });

  it('translates each verb into exactly one simulator operation', async () => {
    const server = makeServer();
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    for (const [method, params, expectedVerb] of QUICK_UTILITIES) {
      server.calls.length = 0;
      await server.utility(method)({ allocationId: allocation.allocationId, ...params }, {});
      expect(server.calls.map((c) => c.verb)).toEqual([expectedVerb]);
    }
  });

  it('maps the four biometric events onto the right sensor and outcome', async () => {
    const server = makeServer();
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    const expected = [
      ['matchFace', { kind: 'face', matched: true }],
      ['unmatchFace', { kind: 'face', matched: false }],
      ['matchFinger', { kind: 'finger', matched: true }],
      ['unmatchFinger', { kind: 'finger', matched: false }],
    ] as const;
    for (const [method, detail] of expected) {
      server.calls.length = 0;
      await server.utility(method)({ allocationId: allocation.allocationId }, {});
      expect(server.calls[0].detail).toEqual(detail);
    }
  });

  /**
   * @issue DTX-6033
   * `setStatusBar`'s overrides are named one by one, not spread-minus-
   * allocationId: the wire type is the addressing field plus the flag
   * vocabulary, and a field the two sides disagree about should fail to
   * compile here, not be forwarded to simctl as an unknown `--flag`.
   */
  it('passes the status-bar overrides on without the addressing field', async () => {
    const server = makeServer();
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    await server.utility('setStatusBar')(
      { allocationId: allocation.allocationId, time: '12:34', wifiBars: 0 },
      {},
    );
    expect(server.calls.at(-1)?.detail).toEqual({ time: '12:34', wifiBars: 0 });
  });

  /**
   * The stale-handle rule inherited by the new surface: a released, foreign
   * or never-issued handle reaches nothing — and the device it used to name is
   * physically untouched, which is the property `resetContentAndSettings`
   * makes load-bearing (a stale wipe that leaked would erase someone else's
   * session).
   */
  it('refuses every utility on a stale handle and touches nothing', async () => {
    const server = makeServer();
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    await call<{ allocationId: string }, unknown>(server.handlers, 'releaseDevice')(
      { allocationId: allocation.allocationId },
      {},
    );
    server.calls.length = 0;

    for (const [method, params] of [...QUICK_UTILITIES, ['resetContentAndSettings', {}, ''] as const]) {
      await expect(
        server.utility(method)({ allocationId: allocation.allocationId, ...params }, {}),
      ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_STALE_HANDLE });
      await expect(
        server.utility(method)({ allocationId: 'never-issued', ...params }, {}),
      ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_STALE_HANDLE });
    }
    expect(server.calls).toEqual([]);
  });
});

describe('parameters the server refuses to guess at', () => {
  /**
   * `UninstallAppParams.appId` is optional on the wire (frozen dialect: a
   * Detox-20 caller may omit it), and until spec 005 the server simply ignored
   * the omission — "uninstalled" while uninstalling nothing. The refusal is a
   * minted code, not a bare throw surfacing as DETOX_UNCLASSIFIED.
   */
  it('refuses uninstallApp without an appId, typed', async () => {
    const server = makeServer();
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    for (const params of [{}, { appId: undefined }, { appId: '' }]) {
      await expect(
        server.utility('uninstallApp')({ allocationId: allocation.allocationId, ...params }, {}),
      ).rejects.toMatchObject({
        code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
        details: { method: 'uninstallApp', parameter: 'appId' },
      });
    }
    expect(server.calls.filter((c) => c.verb === 'uninstall')).toEqual([]);
  });

  it('refuses openURL without a url, setLocation without finite numbers, enrollment without a boolean', async () => {
    const server = makeServer();
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    server.calls.length = 0;
    const id = allocation.allocationId;
    const bad = [
      ['openURL', { allocationId: id }],
      ['setLocation', { allocationId: id, lat: 'north', lon: 3 }],
      ['setLocation', { allocationId: id, lat: 1, lon: Number.NaN }],
      ['setBiometricEnrollment', { allocationId: id, enabled: 'YES' }],
    ] as const;
    for (const [method, params] of bad) {
      await expect(server.utility(method)(params, {})).rejects.toMatchObject({
        code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
      });
    }
    expect(server.calls).toEqual([]);
  });

  /**
   * Ownership precedes the action's own failures too, not just
   * implementedness: a stale handle with a bad argument hears "stale handle",
   * so a caller can never learn from an error code that a foreign allocation
   * exists.
   */
  it('answers a stale handle with a bad argument as stale, never as invalid-argument', async () => {
    const server = makeServer();
    await expect(
      server.utility('uninstallApp')({ allocationId: 'never-issued' }, {}),
    ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_STALE_HANDLE });
  });

  /**
   * @issue DTX-6014
   * `sourceApp` is on the wire because Detox 20's `openURL({url, sourceApp})`
   * sends it, and `simctl openurl` has no way to express "as if app X opened
   * this" — only an app-side deep-link delivery could, which is not built.
   * Dropping it silently would answer success to a request we did not
   * honour: the same false-success-to-typed-refusal move 005 made for
   * `installApp` and for an omitted `appId`.
   */
  it('refuses openURL with a sourceApp instead of quietly dropping it', async () => {
    const server = makeServer();
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    server.calls.length = 0;
    await expect(
      server.utility('openURL')(
        { allocationId: allocation.allocationId, url: 'https://example.com', sourceApp: 'com.example.opener' },
        {},
      ),
    ).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
      details: { method: 'openURL', parameter: 'sourceApp' },
    });
    expect(server.calls).toEqual([]);
    // …while the same call without it goes through untouched.
    await server.utility('openURL')(
      { allocationId: allocation.allocationId, url: 'https://example.com' },
      {},
    );
    expect(server.calls.map((c) => c.verb)).toEqual(['openUrl']);
  });
});

/**
 * The gap this closes: the erase is the one child nobody may kill, and
 * nothing forces a caller to await its wipe before issuing the next command —
 * an un-awaited `boot` fired mid-erase is two simctl commands mutating one
 * device at once.
 */
describe('an in-flight erase fences the whole allocation', () => {
  function deferred(): Gate {
    let resolve!: () => void;
    let reject!: (err: Error) => void;
    const promise = new Promise<void>((res, rej) => {
      resolve = () => res();
      reject = rej;
    });
    return { promise, resolve, reject };
  }

  it('makes a boot arriving mid-erase wait, and run only once the erase settles', async () => {
    const gate = deferred();
    const order: string[] = [];
    const server = makeServer({
      erase: async () => {
        order.push('erase-start');
        await gate.promise;
        order.push('erase-end');
      },
    });
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    server.calls.length = 0;

    const wiping = server.utility('resetContentAndSettings')(
      { allocationId: allocation.allocationId },
      {},
    );
    // Let the choreography reach the erase.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(order).toEqual(['erase-start']);

    const booting = call<{ allocationId: string }, { state: string }>(server.handlers, 'bootDevice')(
      { allocationId: allocation.allocationId },
      {},
    ).then(() => order.push('boot-answered'));

    // The boot is parked on the barrier: nothing of it reaches simctl yet.
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(server.calls.some((c) => c.verb === 'boot')).toBe(false);

    gate.resolve();
    await wiping;
    await booting;
    expect(order).toEqual(['erase-start', 'erase-end', 'boot-answered']);
  });

  /**
   * @issue DTX-6013
   * Ownership check first, then the erase barrier — a stale handle hears
   * `DETOX_STALE_HANDLE` without waiting for anybody else's erase. When the
   * erase was WEDGED, the waiter must never touch the device: the allocation
   * is gone by the time it wakes, so it is re-validated after the barrier
   * and hears the same `DETOX_STALE_HANDLE` a released handle hears
   * (the caller who owned the wipe already got the unknown-state error with
   * the udid in it; a second caller may not learn the fleet's shape from an
   * error code).
   */
  it('refuses a boot that waited through a WEDGED erase, and never spawns it', async () => {
    const gate = deferred();
    const server = makeServer({ erase: () => gate.promise });
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    server.calls.length = 0;

    const wiping = server.utility('resetContentAndSettings')(
      { allocationId: allocation.allocationId },
      {},
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    const booting = call<{ allocationId: string }, { state: string }>(server.handlers, 'bootDevice')(
      { allocationId: allocation.allocationId },
      {},
    );

    gate.reject(new DeviceUnknownStateError('simctl erase was killed after 60000ms', {
      details: { udid: allocation.device.udid },
    }));

    await expect(wiping).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_DEVICE_UNKNOWN_STATE });
    await expect(booting).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_STALE_HANDLE });
    expect(server.calls.some((c) => c.verb === 'boot')).toBe(false);
  });

  /** A stale handle must not queue behind somebody else's erase to be told it is stale. */
  it('answers a stale handle immediately, without waiting on the barrier', async () => {
    const gate = deferred();
    const server = makeServer({ erase: () => gate.promise });
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    const wiping = server.utility('resetContentAndSettings')(
      { allocationId: allocation.allocationId },
      {},
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    await expect(
      server.utility('clearKeychain')({ allocationId: 'never-issued' }, {}),
    ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_STALE_HANDLE });

    gate.resolve();
    await wiping;
  });
});

describe('resetContentAndSettings — the wipe choreography', () => {
  /**
   * @issue DTX-2008
   * The wipe spawns the same `boot` child every physical boot does (spec
   * 005) — `begin`/`end` bracket that child rather than folding it into
   * the wipe's own `progress` events.
   * @issue DTX-2009
   * The `booted` push lands before `resetContentAndSettings` resolves: the
   * push channel is the sole writer of the client's `device.state`, so a
   * caller reading state right after the response must already see it.
   */
  it('shuts down, erases, then boots the same device, narrating the boot only when it runs', async () => {
    const server = makeServer();
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    server.calls.length = 0;
    server.stateNotifications.length = 0;

    const progress: WireProgress[] = [];
    await server.utility('resetContentAndSettings')(
      { allocationId: allocation.allocationId },
      { progress: (v) => progress.push(v as WireProgress) },
    );

    expect(server.calls.map((c) => c.verb)).toEqual(['shutdown', 'erase', 'boot']);
    // Same udid throughout: the erased device keeps its identity.
    expect(new Set(server.calls.map((c) => c.udid))).toEqual(new Set([allocation.device.udid]));
    // A physical boot happened, so a boot child must be bracketed.
    expect(progress.filter((p) => p.op === 'boot').map((p) => p.kind)).toEqual(['begin', 'end']);
    // Pushed BEFORE the response resolves — the push channel is the sole writer
    // of the client's `device.state`, so `booted` has to be there already.
    expect(server.stateNotifications.map((n) => n.state)).toEqual(['shutdown', 'booted']);
  });

  /**
   * @issue DTX-6017
   * The erase child is never killed by the caller's abort — it takes no
   * signal at all. The abort lands while the
   * erase is running, the choreography waits it out, and then — and only
   * then — gives up. A cancelled wipe never boots.
   */
  it('never kills an in-flight erase: it waits the child out, then refuses to boot', async () => {
    const controller = new AbortController();
    let eraseStarted = false;
    let eraseFinished = false;
    const server = makeServer({
      erase: async (args: EraseArgs) => {
        eraseStarted = true;
        // The caller gives up mid-erase…
        controller.abort(new Error('the caller changed its mind'));
        await new Promise((resolve) => setTimeout(resolve, 10));
        eraseFinished = true;
        // …and the erase child is never handed anything to be killed by.
        expect(signalOf(args)).toBeUndefined();
      },
    });
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    server.calls.length = 0;

    await expect(
      server.utility('resetContentAndSettings')(
        { allocationId: allocation.allocationId },
        { signal: controller.signal },
      ),
    ).rejects.toMatchObject({ name: 'AbortError' });

    expect(eraseStarted && eraseFinished).toBe(true);
    // The erase override does its own recording, so only shutdown lands here —
    // what matters is that nothing followed it.
    expect(server.calls.map((c) => c.verb)).toEqual(['shutdown']);
    expect(server.calls.some((c) => c.verb === 'boot')).toBe(false);
  });

  it('leaves the allocation alive after a cancelled wipe — the same handle still works', async () => {
    const controller = new AbortController();
    const server = makeServer({
      erase: async () => {
        controller.abort(new Error('cancelled'));
      },
    });
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    await expect(
      server.utility('resetContentAndSettings')(
        { allocationId: allocation.allocationId },
        { signal: controller.signal },
      ),
    ).rejects.toMatchObject({ name: 'AbortError' });

    // Uncorrupted and still owned: the very same handle boots it again.
    await expect(
      call<{ allocationId: string }, { state: string }>(server.handlers, 'bootDevice')(
        { allocationId: allocation.allocationId },
        {},
      ),
    ).resolves.toEqual({ state: 'booted' });
  });

  /**
   * @issue DTX-6018
   * `_throwIfAborted` gives every handler the same abort rejection. A bare
   * `signal.throwIfAborted()` would send back the caller's raw reason
   * object, so the same cancellation would arrive typed from one handler and
   * shapeless from another; `.cause` carries the reason instead.
   */
  it('does nothing at all when the signal was already aborted before the call, and refuses typed', async () => {
    const server = makeServer();
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    server.calls.length = 0;
    const reason = new Error('too late');
    await expect(
      server.utility('resetContentAndSettings')(
        { allocationId: allocation.allocationId },
        { signal: AbortSignal.abort(reason) },
      ),
    ).rejects.toMatchObject({
      name: 'AbortError',
      code: DetoxErrorCode.DETOX_ABORTED,
      cause: reason,
    });
    expect(server.calls).toEqual([]);
  });

  /**
   * @issue DTX-6019
   * The shutdown leg is the wipe's first physical step, and it must not be
   * killed by the caller either: a `simctl shutdown` killed mid-flight
   * leaves the device in `Shutting Down` with nothing to compensate it, and
   * the wipe would then hand it back as though it were merely cold. The
   * abort is honoured between steps, which is all the contract promises.
   */
  it('hands the wipe’s shutdown child no caller signal — the abort lands between steps', async () => {
    const controller = new AbortController();
    const seen: Array<AbortSignal | undefined> = [];
    const server = makeServer({
      shutdown: async (args: DeviceTargetArgs) => {
        seen.push(args.signal);
        controller.abort(new Error('cancelled during the shutdown'));
        return true;
      },
    });
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    server.calls.length = 0;

    await expect(
      server.utility('resetContentAndSettings')(
        { allocationId: allocation.allocationId },
        { signal: controller.signal },
      ),
    ).rejects.toMatchObject({ name: 'AbortError' });

    expect(seen).toEqual([undefined]);
    // Nothing after the shutdown ran: no erase, and above all no boot.
    expect(server.calls.map((c) => c.verb)).toEqual([]);
  });

  /**
   * Mirrors `_handleShutdownDevice`: a cold device was not shut down by us,
   * and the narration says so.
   *
   * @issue DTX-2011
   * A multi-step utility narrates progress under its own operation name,
   * distinct from the child operations (like `boot`) it spawns along the
   * way.
   */
  it('narrates “already shut down” instead of claiming a shutdown it did not perform', async () => {
    const server = makeServer({ shutdown: async () => false });
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    const progress: WireProgress[] = [];
    await server.utility('resetContentAndSettings')(
      { allocationId: allocation.allocationId },
      { progress: (v) => progress.push(v as WireProgress) },
    );
    expect(progress.some((p) => p.message?.includes('was already shut down'))).toBe(true);
  });

  /**
   * @issue DTX-2010
   * `ok` on a `kind: 'end'` progress event reflects whether the bracketed
   * sub-operation actually succeeded — a failed boot still closes its
   * bracket, but with `ok: false`, never silently as a success.
   */
  it('closes the boot bracket with ok:false when the post-erase boot fails', async () => {
    let booted = 0;
    const failure = new Error('CoreSimulator refused the boot');
    const server = makeServer({
      boot: async ({ udid, onBootStart }: FakeBootArgs) => {
        booted += 1;
        // The allocation's own boot must still succeed; only the wipe's fails.
        if (booted === 1) return true;
        onBootStart?.();
        void udid;
        throw failure;
      },
    });
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    const progress: WireProgress[] = [];
    await expect(
      server.utility('resetContentAndSettings')(
        { allocationId: allocation.allocationId },
        { progress: (v) => progress.push(v as WireProgress) },
      ),
    ).rejects.toBe(failure);
    expect(progress.filter((p) => p.op === 'boot').map((p) => p.kind)).toEqual(['begin', 'end']);
    expect(progress.at(-1)?.ok).toBe(false);
  });
});

describe('a wedged erase leaves the device in an UNKNOWN state', () => {
  /**
   * @issue DTX-6020
   * The wedged-erase outcome, in full: the caller gets a typed infra error,
   * the device leaves its allocation (so the handle is dead from here on), and the udid
   * is excluded from every later pick — in memory only, so a restart clears
   * it. Nothing is shut down, deleted or probed: we do not know what the
   * device is, so we touch nothing.
   */
  it('reports typed, ends the allocation, and fences the udid off from new picks', async () => {
    const server = makeServer({
      erase: () =>
        Promise.reject(
          new DeviceUnknownStateError('simctl erase was killed after 60000ms', {
            details: { udid: 'udid-1' },
          }),
        ),
    });
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});

    await expect(
      server.utility('resetContentAndSettings')({ allocationId: allocation.allocationId }, {}),
    ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_DEVICE_UNKNOWN_STATE });

    // The handle is dead — indistinguishable from released, on purpose.
    await expect(
      server.utility('clearKeychain')({ allocationId: allocation.allocationId }, {}),
    ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_STALE_HANDLE });

    // …and the only device on this fake fleet is no longer allocatable, even
    // though nothing holds it: unknown is not free.
    expect(server.devicePool.busyCount).toBe(0);
    await expect(server.allocate({ type: 'ios.simulator' }, {})).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_POOL_EXHAUSTED,
    });
  });

  /** Any leg's deadline counts, not just the erase's — the shutdown leg gets the same outcome. */
  it('applies the same verdict when the wipe’s SHUTDOWN is the leg the deadline killed', async () => {
    const server = makeServer({
      // What `child_process` hands back when its own `timeout` fires.
      shutdown: () => Promise.reject(Object.assign(new Error('simctl shutdown killed'), { killed: true })),
    });
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    server.calls.length = 0;

    await expect(
      server.utility('resetContentAndSettings')({ allocationId: allocation.allocationId }, {}),
    ).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_DEVICE_UNKNOWN_STATE,
      details: { udid: allocation.device.udid, command: 'simctl shutdown' },
    });

    // Nothing was erased or booted on a device we no longer understand…
    expect(server.calls).toEqual([]);
    // …the handle is dead…
    await expect(
      server.utility('clearKeychain')({ allocationId: allocation.allocationId }, {}),
    ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_STALE_HANDLE });
    // …and the udid is out of the fleet for this server's life.
    await expect(server.allocate({ type: 'ios.simulator' }, {})).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_POOL_EXHAUSTED,
    });
  });

  it('keeps nothing across pools — the exclusion is in-memory only', async () => {
    const shared = fakeSimulatorOps();
    const pool = iosPool(shared.simulatorOps).pool;
    pool.markUnknown('udid-1', 'alloc-nobody', 'test');
    // A fresh pool (the shape a restart produces) knows nothing about it.
    const reborn = iosPool(shared.simulatorOps).pool;
    await expect(reborn.allocate({ allocationId: 'alloc-test', query: {} })).resolves.toMatchObject({ udid: 'udid-1' });
  });
});
