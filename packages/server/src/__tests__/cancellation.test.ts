import { describe, it, expect, afterEach } from 'vitest';
import type { DeviceInfo } from '@detox-remote/driver-ios';

import { DetoxServerImpl } from '../DetoxServerImpl';
import type { DetoxServerPeer } from '../DetoxServerPeer';
import type { SimulatorOps } from '@detox-remote/driver-ios';
import { iosHost, type IosHost } from './_ios-harness';

/** Every driver host a test builds (spec 015): closed after each so its per-device gateways release. */
const cancelHosts: IosHost[] = [];
afterEach(async () => {
  for (const host of cancelHosts.splice(0)) await host.close().catch(() => undefined);
});

interface AllocateParams {
  type: string;
  device?: unknown;
}

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

type AnyHandler = (params: unknown, ctx: HandlerCtx) => Promise<unknown>;
type AllocateHandler = (params: AllocateParams, ctx: HandlerCtx) => Promise<AllocateResponse>;

interface CapturedPeer {
  peer: DetoxServerPeer;
  allocate: () => AllocateHandler;
  /** Any other registered handler, by its registrar name minus `on`. */
  handler: (name: string) => AnyHandler;
}

/** Captures the handlers `DetoxServerImpl` registers, so a test can call them directly. */
function capturingPeer(): CapturedPeer {
  const handlers = new Map<string, AnyHandler>();
  const peer = new Proxy(
    {},
    {
      get: (_target, prop: string) => {
        if (prop.startsWith('on')) {
          return (handler: AnyHandler) => {
            handlers.set(prop.slice(2), handler);
          };
        }
        // Every `notifyX` is irrelevant here.
        return () => {};
      },
    },
  ) as DetoxServerPeer;

  return {
    peer,
    allocate: () => {
      const handler = handlers.get('AllocateDevice');
      if (!handler) throw new Error('allocateDevice handler was never registered');
      return handler as unknown as AllocateHandler;
    },
    handler: (name) => {
      const handler = handlers.get(name);
      if (!handler) throw new Error(`${name} handler was never registered`);
      return handler;
    },
  };
}

type CancelOutcome = 'undone' | 'nothing-to-undo' | 'undo-failed' | 'unknown';

interface Call<T> {
  /** Resolves the way the caller's promise would; rejects after the rollback ran. */
  result: Promise<T>;
  /**
   * Runs the rollback the way a *late* `$/cancelRequest` does — the request was
   * already answered, and the peer kept its ledger for exactly this.
   */
  cancelLate: () => Promise<CancelOutcome>;
}

/**
 * Invokes a handler under the same contract `Peer._handleRequest` gives it:
 * a `ctx.onUndo` ledger that unwinds LIFO on any unsuccessful ending, and
 * survives a successful one so a cancellation arriving afterwards can still
 * take the work back (race R2).
 *
 * The handler is deliberately NOT driven through a real `Peer` here: these
 * tests are about what the *server* registers, and a real peer would drag a
 * channel, a wire dialect and its own retention timers into every assertion.
 * The peer's own half of the contract is gated in
 * `packages/core/src/__tests__/cancel-ack.test.ts`.
 */
function throughPeer<T>(
  handler: (params: never, ctx: HandlerCtx) => Promise<T>,
  params: unknown,
  ctx: HandlerCtx = {},
): Call<T> {
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
      return await handler(params as never, { ...ctx, onUndo: (fn) => fns.push(fn) });
    } catch (err) {
      await run();
      throw err;
    }
  })();

  return { result, cancelLate: run };
}

/** Lets queued microtasks and a macrotask-0 run. */
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

interface FakeOps {
  simulatorOps: SimulatorOps;
  shutdownCalls: string[];
}

/** The one method this file's fixture reaches in to slow down. */
interface BootableOps {
  boot: () => Promise<boolean>;
}

/** The other method this file's fixtures reach in to break. */
interface ShutdownableOps {
  shutdown: () => Promise<boolean>;
}

interface ShutdownArgs {
  udid: string;
}

interface ServerHolder {
  impl?: DetoxServerImpl;
}

/**
 * `boot` runs `duringBoot` before succeeding — the "cancelled while working"
 * window. `alreadyBooted` mirrors the real `SimulatorOps.boot`, which returns
 * `false` when the device was already up (a warm device from the pool).
 */
function fakeSimulatorOps(duringBoot: () => void, alreadyBooted = false): FakeOps {
  const shutdownCalls: string[] = [];
  const devices: DeviceInfo[] = [
    {
      name: 'iPhone 17',
      udid: 'udid-1',
      state: alreadyBooted ? 'Booted' : 'Shutdown',
      os: { platform: 'iOS' },
    } as DeviceInfo,
  ];
  const simulatorOps = {
    list: async () => {
      await Promise.resolve();
      return devices;
    },
    boot: async () => {
      await Promise.resolve();
      duringBoot();
      return !alreadyBooted;
    },
    shutdown: async (args: ShutdownArgs) => {
      shutdownCalls.push(args.udid);
      return true;
    },
    state: async () => 'Booted',
  } as unknown as SimulatorOps;

  return { simulatorOps, shutdownCalls };
}

/**
 * @issue DTX-6005
 * A cancellation that lands *after* the handler already succeeded. The peer
 * answers `-32800` and throws the response away — including the
 * `allocationId`, which was the only handle anyone had on that device.
 * Without a rollback the simulator stays booted and permanently busy for the
 * lifetime of the server. `_handleLaunchApp` closes the same race one level
 * down, over the app handle instead of the allocation.
 */
describe('allocateDevice cancelled after it succeeded', () => {
  it('shuts the simulator down and frees the slot instead of stranding it', async () => {
    const controller = new AbortController();
    const { simulatorOps, shutdownCalls } = fakeSimulatorOps(() => controller.abort());
    const cancelHost = iosHost(simulatorOps);
    cancelHosts.push(cancelHost);
    const devicePool = cancelHost.pool;
    const { peer, allocate } = capturingPeer();
    new DetoxServerImpl({ serverPeer: peer, driverHost: cancelHost.host });

    await expect(
      throughPeer(allocate(), { type: 'ios.simulator' }, { signal: controller.signal }).result,
    ).rejects.toMatchObject({ name: 'AbortError' });

    expect(shutdownCalls).toEqual(['udid-1']);
    expect(devicePool.busyCount).toBe(0);
  });

  it('does the same when the socket died mid-allocation', async () => {
    // The server has to exist before it can be told the socket died, and the
    // fake has to know about it before the server exists — hence the holder.
    const server: ServerHolder = {};
    // release() is what the channel's close listener calls.
    const { simulatorOps, shutdownCalls } = fakeSimulatorOps(() => void server.impl?.release());
    const cancelHost = iosHost(simulatorOps);
    cancelHosts.push(cancelHost);
    const devicePool = cancelHost.pool;
    const { peer, allocate } = capturingPeer();
    server.impl = new DetoxServerImpl({ serverPeer: peer, driverHost: cancelHost.host });

    await expect(
      throughPeer(allocate(), { type: 'ios.simulator' }).result,
    ).rejects.toMatchObject({
      name: 'AbortError',
    });

    // No watcher was ever registered, so nothing polls a device nobody owns.
    expect(shutdownCalls).toEqual(['udid-1']);
    expect(devicePool.busyCount).toBe(0);
  });

  /**
   * @issue DTX-6006
   * Rolling back must not cost the pool a warm device. `boot()` returning
   * `false` means the device was already up when we got it, so shutting it
   * down would destroy capacity the keep-warm policy deliberately kept —
   * punishing the next allocation for this one's cancellation.
   */
  it('frees a warm device without shutting it down', async () => {
    const controller = new AbortController();
    const { simulatorOps, shutdownCalls } = fakeSimulatorOps(() => controller.abort(), true);
    const cancelHost = iosHost(simulatorOps);
    cancelHosts.push(cancelHost);
    const devicePool = cancelHost.pool;
    const { peer, allocate } = capturingPeer();
    new DetoxServerImpl({ serverPeer: peer, driverHost: cancelHost.host });

    await expect(
      throughPeer(allocate(), { type: 'ios.simulator' }, { signal: controller.signal }).result,
    ).rejects.toMatchObject({ name: 'AbortError' });

    expect(shutdownCalls).toEqual([]);
    expect(devicePool.busyCount).toBe(0);
  });

  it('hands the device over normally when nothing was cancelled', async () => {
    const { simulatorOps, shutdownCalls } = fakeSimulatorOps(() => {});
    const cancelHost = iosHost(simulatorOps);
    cancelHosts.push(cancelHost);
    const devicePool = cancelHost.pool;
    const { peer, allocate } = capturingPeer();
    const impl = new DetoxServerImpl({ serverPeer: peer, driverHost: cancelHost.host });

    const response = await throughPeer(allocate(), { type: 'ios.simulator' }).result;

    expect(response.device.udid).toBe('udid-1');
    expect(shutdownCalls).toEqual([]);
    expect(devicePool.busyCount).toBe(1);

    await impl.release();
  });
});

/**
 * @issue DTX-6007
 * Race R2 at the device level: the answer left the server, the caller had
 * already walked away, and the `$/cancelRequest` arrives afterwards. The peer
 * keeps the request's ledger for a minute for exactly this — the rollback is
 * registered up front, before any await, so it covers the handler throwing,
 * a mid-flight cancellation, and one arriving after the answer already left.
 *
 * Cancelling a successful allocation must be worth exactly what releasing it
 * is: the device goes back, the record goes away, the id stops addressing
 * anything.
 */
describe('allocateDevice cancelled after the answer was already sent', () => {
  it('returns the device to the pool and reports what it rolled back', async () => {
    const { simulatorOps, shutdownCalls } = fakeSimulatorOps(() => {});
    const cancelHost = iosHost(simulatorOps);
    cancelHosts.push(cancelHost);
    const devicePool = cancelHost.pool;
    const { peer, allocate } = capturingPeer();
    new DetoxServerImpl({ serverPeer: peer, driverHost: cancelHost.host });

    const call = throughPeer(allocate(), { type: 'ios.simulator' });
    await call.result;
    expect(devicePool.busyCount).toBe(1);

    // The cancellation the answer outran.
    expect(await call.cancelLate()).toBe('undone');

    expect(devicePool.busyCount).toBe(0);
    // We booted this one, so the rollback owes the shutdown its successful
    // sibling would never have performed — same rule as the mid-flight branch.
    expect(shutdownCalls).toEqual(['udid-1']);
  });

  it('leaves a warm device booted, exactly as releasing it would', async () => {
    const { simulatorOps, shutdownCalls } = fakeSimulatorOps(() => {}, true);
    const cancelHost = iosHost(simulatorOps);
    cancelHosts.push(cancelHost);
    const devicePool = cancelHost.pool;
    const { peer, allocate } = capturingPeer();
    new DetoxServerImpl({ serverPeer: peer, driverHost: cancelHost.host });

    const call = throughPeer(allocate(), { type: 'ios.simulator' });
    await call.result;

    expect(await call.cancelLate()).toBe('undone');
    expect(devicePool.busyCount).toBe(0);
    expect(shutdownCalls).toEqual([]);
  });

  /**
   * @issue DTX-6008
   * The id stops addressing the device synchronously, before any await — a
   * rollback that yielded first would leave the handle live while the device
   * is being taken apart. Otherwise a client that kept the id from a response
   * it was supposed to discard could still drive a device the pool has
   * already handed to someone else. The stale-handle answer is the same one
   * a released allocation gets.
   */
  it('makes the allocation id stale, so nothing can still drive that device', async () => {
    const { simulatorOps } = fakeSimulatorOps(() => {});
    const cancelHost = iosHost(simulatorOps);
    cancelHosts.push(cancelHost);
    const { peer, allocate, handler } = capturingPeer();
    new DetoxServerImpl({ serverPeer: peer, driverHost: cancelHost.host });

    const call = throughPeer(allocate(), { type: 'ios.simulator' });
    const { allocationId } = await call.result;
    await call.cancelLate();

    await expect(
      handler('ShutdownDevice')({ allocationId }, {}),
    ).rejects.toMatchObject({ code: 2008 });
  });

  /**
   * The reclaim barrier, on the rollback path. Releasing a device out from
   * under a physical operation still running on it hands the next owner a
   * simulator the previous life is still mutating — which is why
   * `releaseDevice` waits, and why cancelling must wait for exactly the same
   * reason. The two paths owe the same thing, so they do the same thing.
   */
  it('waits out an in-flight device action before letting the device go', async () => {
    const { simulatorOps, shutdownCalls } = fakeSimulatorOps(() => {});
    let letBootFinish!: () => void;
    const gate = new Promise<void>((resolve) => {
      letBootFinish = resolve;
    });
    let boots = 0;
    const ops = simulatorOps as unknown as BootableOps;
    const allocationBoot = ops.boot.bind(ops);
    // The allocation's own boot runs freely; the `bootDevice` action that
    // follows it parks until the test says otherwise.
    ops.boot = async () => {
      if (++boots > 1) await gate;
      return allocationBoot();
    };

    const cancelHost = iosHost(simulatorOps);
    cancelHosts.push(cancelHost);
    const devicePool = cancelHost.pool;
    const { peer, allocate, handler } = capturingPeer();
    new DetoxServerImpl({ serverPeer: peer, driverHost: cancelHost.host });

    const call = throughPeer(allocate(), { type: 'ios.simulator' });
    const { allocationId } = await call.result;

    const action = handler('BootDevice')({ allocationId }, {});
    await tick();

    const rollback = call.cancelLate();
    await tick();
    // Still ours: the rollback is standing at the barrier, not walking past it.
    expect(devicePool.busyCount).toBe(1);
    expect(shutdownCalls).toEqual([]);

    letBootFinish();
    await action;
    await rollback;

    expect(devicePool.busyCount).toBe(0);
    expect(shutdownCalls).toEqual(['udid-1']);
  });

  /**
   * @issue DTX-6009
   * The theft this ownership model exists to make impossible, in its
   * rollback form. The ledger outlives the answer by a minute, and in that
   * minute the udid can legitimately move on: released, taken warm by
   * another connection, and now carrying someone else's test. Ownership is
   * re-checked first — a rollback addressing the device by bare udid would
   * shut down a stranger's live simulator and then report `undone`, false
   * twice: nothing of ours was taken back, and something of theirs was
   * destroyed. A conforming client cannot stage this (it never gets a handle
   * to release); the trigger is a duplicate or stale `$/cancelRequest`.
   * The standing rule applies — a udid is never an address.
   */
  it('never touches a device the pool has since handed to someone else', async () => {
    const { simulatorOps, shutdownCalls } = fakeSimulatorOps(() => {});
    const cancelHost = iosHost(simulatorOps);
    cancelHosts.push(cancelHost);
    const devicePool = cancelHost.pool;
    const { peer, allocate, handler } = capturingPeer();
    new DetoxServerImpl({ serverPeer: peer, driverHost: cancelHost.host });

    // The first holder allocates, is answered, and releases normally — the
    // device goes back warm, still booted.
    const first = throughPeer(allocate(), { type: 'ios.simulator' });
    const { allocationId } = await first.result;
    await handler('ReleaseDevice')({ allocationId }, {});
    expect(devicePool.busyCount).toBe(0);

    // The next holder takes the same udid, warm.
    const second = throughPeer(allocate(), { type: 'ios.simulator' });
    await second.result;
    expect(devicePool.busyCount).toBe(1);

    // Only now does the first holder's cancellation arrive.
    await first.cancelLate();

    // Untouched: no shutdown of a live foreign device, and its claim intact.
    expect(shutdownCalls).toEqual([]);
    expect(devicePool.busyCount).toBe(1);
  });

  it('is idempotent: a duplicate late cancellation frees nothing twice', async () => {
    const { simulatorOps, shutdownCalls } = fakeSimulatorOps(() => {});
    const cancelHost = iosHost(simulatorOps);
    cancelHosts.push(cancelHost);
    const devicePool = cancelHost.pool;
    const { peer, allocate } = capturingPeer();
    new DetoxServerImpl({ serverPeer: peer, driverHost: cancelHost.host });

    const first = throughPeer(allocate(), { type: 'ios.simulator' });
    await first.result;
    await first.cancelLate();
    await first.cancelLate();

    // Freed exactly once — the ledger runs at most once, however many
    // cancellations name it.
    expect(shutdownCalls).toEqual(['udid-1']);
    expect(devicePool.busyCount).toBe(0);
  });

  /**
   * @issue DTX-6010
   * `undone` is a claim about facts, and a refused `simctl shutdown` makes it
   * false: the claim still comes back to the pool (a device nobody can shut
   * down is still worth more free than held forever), but the failure is
   * remembered and rethrown at the end so the caller hears `undo-failed`
   * rather than a clean `undone` about a device that is very much still up.
   */
  it('reports `undo-failed` when the compensating shutdown is refused', async () => {
    const { simulatorOps } = fakeSimulatorOps(() => {});
    const ops = simulatorOps as unknown as ShutdownableOps;
    ops.shutdown = async () => {
      throw new Error('simctl shutdown refused');
    };

    const cancelHost = iosHost(simulatorOps);
    cancelHosts.push(cancelHost);
    const devicePool = cancelHost.pool;
    const { peer, allocate } = capturingPeer();
    new DetoxServerImpl({ serverPeer: peer, driverHost: cancelHost.host });

    const call = throughPeer(allocate(), { type: 'ios.simulator' });
    await call.result;

    expect(await call.cancelLate()).toBe('undo-failed');
    // The claim is still dropped: a device we could not power down is worth
    // more to the pool than a slot nobody can ever have back.
    expect(devicePool.busyCount).toBe(0);
  });
});

/**
 * "Free everything I hold" and "this connection is over" are different
 * events: `releaseAll()` frees what the connection holds and leaves it
 * usable; only `release()` — the socket dying — is terminal.
 */
describe('releasing every device without closing the connection', () => {
  it('leaves the connection able to allocate again', async () => {
    const { simulatorOps } = fakeSimulatorOps(() => {});
    const cancelHost = iosHost(simulatorOps);
    cancelHosts.push(cancelHost);
    const devicePool = cancelHost.pool;
    const { peer, allocate } = capturingPeer();
    const impl = new DetoxServerImpl({ serverPeer: peer, driverHost: cancelHost.host });

    await throughPeer(allocate(), { type: 'ios.simulator' }).result;
    await impl.releaseAll();
    expect(devicePool.busyCount).toBe(0);

    const second = await throughPeer(allocate(), { type: 'ios.simulator' }).result;
    expect(second.device.udid).toBe('udid-1');
    expect(devicePool.busyCount).toBe(1);

    await impl.release();
  });

  it('but a dead socket is terminal', async () => {
    const { simulatorOps } = fakeSimulatorOps(() => {});
    const cancelHost = iosHost(simulatorOps);
    cancelHosts.push(cancelHost);
    const devicePool = cancelHost.pool;
    const { peer, allocate } = capturingPeer();
    const impl = new DetoxServerImpl({ serverPeer: peer, driverHost: cancelHost.host });

    await impl.release();

    await expect(
      throughPeer(allocate(), { type: 'ios.simulator' }).result,
    ).rejects.toMatchObject({
      name: 'AbortError',
    });
    expect(devicePool.busyCount).toBe(0);
  });
});
