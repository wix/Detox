import { describe, it, expect, vi } from 'vitest';
import type { DeviceInfo } from '@detox-remote/protocol';

import { DevicePool } from '../DevicePool';
import type {
  CreatableDeviceType,
  DeviceTargetArgs,
  RawDeviceListing,
  SimulatorOps,
} from '../SimulatorOps';

function device(name: string, udid: string, state = 'Shutdown'): DeviceInfo {
  return { name, udid, state, os: { platform: 'iOS', name: 'iOS 26.5' } } as DeviceInfo;
}

interface FakeOpsOptions {
  devices?: DeviceInfo[];
  rawDevices?: () => RawDeviceListing[];
  creatable?: CreatableDeviceType;
  createError?: Error;
}

interface FakeOps {
  simulatorOps: SimulatorOps;
  shutdownCalls: string[];
  deleteCalls: string[];
  listCalls: () => number;
}

/**
 * A stand-in for the real `simctl`/`applesimutils` wrapper. `list` yields the
 * microtask queue before answering, which is the whole point: the gap between
 * "read the world" and "mark my pick busy" is where the race lived.
 */
function fakeSimulatorOps({ devices = [], rawDevices, creatable, createError }: FakeOpsOptions = {}): FakeOps {
  let created = 0;
  let listCalls = 0;
  const shutdownCalls: string[] = [];
  const deleteCalls: string[] = [];
  const simulatorOps = {
    list: async () => {
      listCalls += 1;
      await Promise.resolve();
      return devices;
    },
    create: async () => {
      await Promise.resolve();
      if (createError) throw createError;
      return `created-${++created}`;
    },
    rawDevices: async () => rawDevices?.() ?? [],
    deleteDevice: async ({ udid }: DeviceTargetArgs) => {
      deleteCalls.push(udid);
    },
    shutdown: async ({ udid }: DeviceTargetArgs) => {
      shutdownCalls.push(udid);
      return true;
    },
    creatableDeviceType: async () => creatable,
  } as unknown as SimulatorOps;

  return { simulatorOps, shutdownCalls, deleteCalls, listCalls: () => listCalls };
}

/** The exhaustion payload's shape, as far as these tests inspect it. */
interface ExhaustionDetails {
  holders: Array<Record<string, unknown>>;
  /** Additive field (spec 005): udids excluded because their state is unknown. */
  unknown?: string[];
}

interface CodedRejection {
  message?: string;
  details?: ExhaustionDetails;
}

async function rejectionOf(promise: Promise<unknown>): Promise<CodedRejection> {
  try {
    await promise;
  } catch (err) {
    return err as CodedRejection;
  }
  throw new Error('expected a rejection');
}

describe('DevicePool.allocate', () => {
  /**
   * @issue DTX-6225
   * Spec 002's dialect: when every matching device is busy, the answer is an
   * instant typed refusal naming the holders — never a look-alike simulator
   * created on the side (which could answer a `byId` query with a different
   * device and grows the fleet monotonically, since completed creations are
   * never deleted).
   */
  it('refuses instantly when every matching device is busy, naming the holder', async () => {
    const { simulatorOps } = fakeSimulatorOps({ devices: [device('iPhone 17', 'udid-a')] });
    const pool = new DevicePool({ simulatorOps, maxPool: 4 });

    const first = await pool.allocate({ query: {} });

    const err = await rejectionOf(pool.allocate({ query: {} }));
    const holders = err.details?.holders ?? [];
    expect(holders).toHaveLength(1);
    expect(holders[0].allocationId).toBe(first.allocationId);
    expect(pool.busyCount).toBe(1);
  });

  it('never hands the same device to two concurrent callers', async () => {
    const pool = new DevicePool({
      simulatorOps: fakeSimulatorOps({
        devices: [device('iPhone 17', 'udid-a'), device('iPhone 17', 'udid-b')],
      }).simulatorOps,
      maxPool: 4,
    });

    const [first, second] = await Promise.all([
      pool.allocate({ query: {} }),
      pool.allocate({ query: {} }),
    ]);

    expect(first.udid).not.toBe(second.udid);
    expect(pool.busyCount).toBe(2);
  });

  /**
   * @issue DTX-6227
   * Fail-fast on a full pool: warm devices are not "full"
   * since they can be evicted, so only held ones count toward the cap.
   * Pre-existing free simulators must not walk straight around it.
   */
  it('caps every allocation, not only the ones that create a simulator', async () => {
    const pool = new DevicePool({
      simulatorOps: fakeSimulatorOps({
        devices: [device('iPhone 17', 'udid-a'), device('iPhone 17', 'udid-b')],
      }).simulatorOps,
      maxPool: 1,
    });

    await pool.allocate({ query: {} });
    await expect(pool.allocate({ query: {} })).rejects.toThrow('All 1 device slots are taken (1 busy)');
  });

  /**
   * @issue DTX-6221
   * A queued allocation's rejection must not poison the whole lock chain —
   * one failure must not take every queued allocation down with it.
   */
  it('keeps serving queued allocations after one of them fails', async () => {
    const pool = new DevicePool({ simulatorOps: fakeSimulatorOps().simulatorOps, maxPool: 4 });

    const failing = pool.allocate({ query: { byName: 'nothing' } });
    const alsoFailing = pool.allocate({ query: { byName: 'nothing' } });

    await expect(failing).rejects.toThrow('No simulator matching');
    await expect(alsoFailing).rejects.toThrow('No simulator matching');
  });

  it('prefers an already-booted device — the cheapest allocation there is', async () => {
    const pool = new DevicePool({
      simulatorOps: fakeSimulatorOps({
        devices: [device('iPhone 17', 'cold'), device('iPhone 17', 'warm', 'Booted')],
      }).simulatorOps,
      maxPool: 4,
    });

    expect((await pool.allocate({ query: {} })).udid).toBe('warm');
  });

  /**
   * @issue DTX-6234
   * The query is the contract: a client that asked for nothing in
   * particular has said that anything will do, and the pool may not
   * overrule that — the only thing that makes an
   * answer wrong is failing to match what was actually asked for.
   */
  it('answers an empty query with whatever it has, holding no opinion on shape', async () => {
    const pool = new DevicePool({
      simulatorOps: fakeSimulatorOps({ devices: [device('iPad Pro 11-inch', 'ipad')] }).simulatorOps,
      maxPool: 4,
    });

    expect((await pool.allocate({ query: {} })).udid).toBe('ipad');
  });

  it('honours an explicit query', async () => {
    const pool = new DevicePool({
      simulatorOps: fakeSimulatorOps({ devices: [device('iPad Pro 11-inch', 'ipad')] }).simulatorOps,
      maxPool: 4,
    });

    expect((await pool.allocate({ query: { byName: 'iPad Pro 11-inch' } })).udid).toBe('ipad');
  });

  /**
   * @issue DTX-6219
   * Fail-fast makes retries the ecosystem norm, so the refusal
   * path must stay off the subprocess: consecutive refusals of the same query
   * answer from the listing memo instead of spawning a listing each.
   */
  it('consecutive refusals reuse the listing memo instead of re-listing', async () => {
    const { simulatorOps, listCalls } = fakeSimulatorOps({ devices: [device('iPhone 17', 'udid-a')] });
    const pool = new DevicePool({ simulatorOps, maxPool: 1 });

    await pool.allocate({ query: {} });
    const afterAllocate = listCalls();
    for (let i = 0; i < 3; i++) {
      await expect(pool.allocate({ query: {} })).rejects.toThrow('All 1 device slots are taken (1 busy)');
    }
    expect(listCalls()).toBe(afterAllocate);
  });
});

/**
 * @issue DTX-6224
 * Unknown-state devices on the allocation path: the refusal code stays
 * `DETOX_POOL_EXHAUSTED` (a restart cures it, so it is not terminal), but
 * everything the client reads off it must tell the truth — the documented
 * idiom is release-everything-then-retry, and a client following it would
 * otherwise loop forever waiting for a holder that does not exist.
 */
describe('devices in an unknown state (spec 005)', () => {
  it('refuses with a message that names the unknown state, not a phantom holder', async () => {
    const { simulatorOps } = fakeSimulatorOps({ devices: [device('iPhone 17', 'udid-a')] });
    const pool = new DevicePool({ simulatorOps, maxPool: 4 });

    const allocation = await pool.allocate({ query: {} });
    pool.markUnknown(allocation.udid, allocation.allocationId, 'a wedged erase was killed');

    const err = await rejectionOf(pool.allocate({ query: {} }));
    // Nobody holds anything — saying "busy" would send the caller into the
    // retry idiom for a device no retry can free.
    expect(err.details?.holders).toEqual([]);
    expect(err.message).toContain('unknown state');
    expect(err.message).toContain('restart');
    expect(err.details?.unknown).toEqual(['udid-a']);
  });

  it('still says "busy" — and names the unknown ones — when both are in play', async () => {
    const { simulatorOps } = fakeSimulatorOps({
      devices: [device('iPhone 17', 'udid-a'), device('iPhone 17', 'udid-b')],
    });
    const pool = new DevicePool({ simulatorOps, maxPool: 4 });

    const first = await pool.allocate({ query: {} });
    const second = await pool.allocate({ query: {} });
    pool.markUnknown(second.udid, second.allocationId, 'a wedged erase was killed');

    const err = await rejectionOf(pool.allocate({ query: {} }));
    expect(err.message).toContain('is busy');
    expect(err.details?.holders).toHaveLength(1);
    expect(err.details?.holders[0].allocationId).toBe(first.allocationId);
    expect(err.details?.unknown).toEqual([second.udid]);
  });

  /**
   * @issue DTX-6226
   * A wedged simulator still occupies the Mac — its processes, its disk, its
   * CoreSimulator slot — until the server restarts. Leaving it out of the
   * `--max-pool` accounting would let the host creep past the cap by exactly
   * the number of devices that went wrong.
   */
  it('counts toward --max-pool, so a creation the pool would otherwise accept is refused', async () => {
    const { simulatorOps } = fakeSimulatorOps({
      devices: [device('iPhone 17', 'udid-a')],
      creatable: {
        deviceTypeIdentifier: 'com.apple.CoreSimulator.SimDeviceType.iPhone-17',
        runtime: { identifier: 'com.apple.CoreSimulator.SimRuntime.iOS-26-5', name: 'iOS 26.5', version: '26.5' },
      },
    });
    const pool = new DevicePool({ simulatorOps, maxPool: 1 });

    const allocation = await pool.allocate({ query: {} });
    // Released, so the slot looks free — but the device is wedged, not free.
    pool.markUnknown(allocation.udid, allocation.allocationId, 'a wedged erase was killed');

    const err = await rejectionOf(pool.allocate({ query: { byType: 'iPhone 99' } }));
    expect(err.message).toContain('in an unknown state');
    expect(err.details?.unknown).toEqual(['udid-a']);
  });
});

describe('DevicePool ownership (spec 002)', () => {
  /**
   * @issue DTX-6218
   * The wire-invisible half of accept-002 test 8: a stale release — a
   * duplicate, or a rollback firing after the device moved on to a new owner —
   * must free nothing. Theft is the one forbidden outcome.
   */
  it('a release presenting a stale allocation id frees nothing', async () => {
    const { simulatorOps } = fakeSimulatorOps({ devices: [device('iPhone 17', 'udid-a')] });
    const pool = new DevicePool({ simulatorOps, maxPool: 1 });

    const first = await pool.allocate({ query: {} });
    pool.noteState('udid-a', 'Booted');

    expect(pool.release('udid-a', 'alloc-999')).toBeUndefined();
    expect(pool.busyCount).toBe(1);

    expect(pool.release('udid-a', first.allocationId)).toBeTruthy();
    const second = await pool.allocate({ query: {} });

    // The stale-rollback vector: the old claim frees by its dead id after a
    // reclaim handed the udid to someone else.
    expect(pool.release('udid-a', first.allocationId)).toBeUndefined();
    expect(pool.busyCount).toBe(1);

    const err = await rejectionOf(pool.allocate({ query: {} }));
    const holders = err.details?.holders ?? [];
    expect(holders).toHaveLength(1);
    expect(holders[0].allocationId).toBe(second.allocationId);
  });

  it('names every holder with hold age in the exhaustion payload', async () => {
    const { simulatorOps } = fakeSimulatorOps({
      devices: [device('iPhone 17', 'udid-a'), device('iPhone 17', 'udid-b')],
    });
    const pool = new DevicePool({ simulatorOps, maxPool: 2 });

    const first = await pool.allocate({ query: {} });
    const second = await pool.allocate({ query: {} });

    const err = await rejectionOf(pool.allocate({ query: {} }));
    const holders = err.details?.holders ?? [];
    expect(new Set(holders.map((h) => h.allocationId))).toEqual(
      new Set([first.allocationId, second.allocationId]),
    );
    for (const holder of holders) {
      expect(typeof holder.udid).toBe('string');
      expect(typeof holder.ageMs).toBe('number');
      expect(holder.ageMs as number).toBeGreaterThanOrEqual(0);
    }
  });
});

/**
 * @issue DTX-6222
 * `release` returns a device to the warm set only when it is physically
 * booted — release promises nothing physical, and warmth is
 * capacity the next allocation reuses.
 */
describe('DevicePool warm pool and eviction', () => {
  it('evicts the least recently used warm device when a claim needs its slot', async () => {
    const { simulatorOps, shutdownCalls } = fakeSimulatorOps({
      devices: [device('A', 'udid-a'), device('B', 'udid-b'), device('C', 'udid-c')],
    });
    const pool = new DevicePool({ simulatorOps, maxPool: 2 });
    const only = (udid: string) => (d: DeviceInfo) => d.udid === udid;

    const a = await pool.allocate({ query: {}, filter: only('udid-a') });
    pool.noteState('udid-a', 'Booted');
    pool.release('udid-a', a.allocationId);
    await new Promise((resolve) => setTimeout(resolve, 5));

    const b = await pool.allocate({ query: {}, filter: only('udid-b') });
    pool.noteState('udid-b', 'Booted');
    pool.release('udid-b', b.allocationId);

    // Two warm devices fill the cap; this claim needs a fresh slot.
    await pool.allocate({ query: {}, filter: only('udid-c') });

    expect(shutdownCalls).toEqual(['udid-a']);
    expect(pool.busyCount).toBe(1);
  });

  /**
   * @issue DTX-6228
   * A pick that is itself warm simply reuses its own slot (selection ran
   * first, under the same allocation lock).
   */
  it('a warm pick reuses its own slot instead of evicting anyone', async () => {
    const { simulatorOps, shutdownCalls } = fakeSimulatorOps({
      devices: [device('A', 'udid-a'), device('B', 'udid-b')],
    });
    const pool = new DevicePool({ simulatorOps, maxPool: 2 });

    for (const udid of ['udid-a', 'udid-b']) {
      const claim = await pool.allocate({ query: {}, filter: (d) => d.udid === udid });
      pool.noteState(udid, 'Booted');
      pool.release(udid, claim.allocationId);
    }

    // Cap is full of warmth, but the pick is itself warm — nothing to evict.
    const again = await pool.allocate({ query: {}, filter: (d) => d.udid === 'udid-a' });
    expect(again.udid).toBe('udid-a');
    expect(shutdownCalls).toEqual([]);
  });

  /**
   * @issue DTX-6229
   * Eviction scope (spec 002 charter): only devices this life handed out are
   * evictable. A found-booted device — booted by a human or a previous life —
   * neither eats pool capacity nor is ever shut down until first touched.
   */
  it('never evicts a found-booted device and never counts it toward the cap', async () => {
    const { simulatorOps, shutdownCalls } = fakeSimulatorOps({
      devices: [device('Foreign', 'udid-f', 'Booted'), device('C', 'udid-c')],
    });
    const pool = new DevicePool({ simulatorOps, maxPool: 1 });

    const claim = await pool.allocate({ query: {}, filter: (d) => d.udid === 'udid-c' });
    expect(claim.udid).toBe('udid-c');
    expect(shutdownCalls).toEqual([]);
  });
});

describe('DevicePool create path (spec 002)', () => {
  const creatable: CreatableDeviceType = {
    deviceTypeIdentifier: 'com.apple.CoreSimulator.SimDeviceType.iPhone-16-Pro',
    runtime: { identifier: 'com.apple.CoreSimulator.SimRuntime.iOS-26-5', name: 'iOS 26.5', version: '26.5' },
  };

  it('creates a simulator for a creatable model with zero instances', async () => {
    const { simulatorOps } = fakeSimulatorOps({ creatable });
    const pool = new DevicePool({ simulatorOps, maxPool: 4 });

    const result = await pool.allocate({
      query: { byType: 'iPhone 16 Pro' },
      requestedType: 'ios.simulator',
    });

    expect(result.created).toBe(true);
    expect(result.device.name).toBe('iPhone 16 Pro');
    expect(pool.busyCount).toBe(1);
  });

  /**
   * @issue DTX-6220
   * The race is on the create path, not the pick path: the capacity check
   * and the claim straddle `await create()`, so without the lock every
   * concurrent creatable caller would see the same free slot and every one
   * of them would create.
   */
  it('does not overshoot the pool cap when creatable allocations race', async () => {
    const { simulatorOps } = fakeSimulatorOps({ creatable });
    const pool = new DevicePool({ simulatorOps, maxPool: 1 });

    const outcomes = await Promise.allSettled([
      pool.allocate({ query: { byType: 'iPhone 16 Pro' }, requestedType: 'ios.simulator' }),
      pool.allocate({ query: { byType: 'iPhone 16 Pro' }, requestedType: 'ios.simulator' }),
    ]);

    expect(pool.busyCount).toBeLessThanOrEqual(1);
    expect(outcomes.filter((o) => o.status === 'fulfilled')).toHaveLength(1);
    expect(outcomes.filter((o) => o.status === 'rejected')).toHaveLength(1);
  });

  it('refuses terminally when nothing matches and nothing is creatable', async () => {
    const { simulatorOps } = fakeSimulatorOps();
    const pool = new DevicePool({ simulatorOps, maxPool: 4 });

    await expect(
      pool.allocate({ query: { byType: 'Nokia 3310' }, requestedType: 'ios.simulator' }),
    ).rejects.toThrow('No simulator matching');
  });

  /**
   * @issue DTX-6231
   * Accept-002 test 3 at unit level: a create that dies (the killed subprocess,
   * the abort) must delete whatever it managed to make — in-memory rollback,
   * no journal.
   */
  it('a failed create deletes the half-made simulator it left behind', async () => {
    // The half-made device appears only once the create has run — the
    // pre-create snapshot must not see it, or the rollback would (correctly)
    // treat it as somebody else's and leave it alone.
    let createRan = false;
    let deleted = false;
    const { simulatorOps, deleteCalls } = fakeSimulatorOps({
      creatable,
      rawDevices: () =>
        createRan && !deleted ? [{ udid: 'half-made', name: 'iPhone 16 Pro', state: 'Creating' }] : [],
    });
    simulatorOps.create = async () => {
      createRan = true;
      throw new Error('simctl create was killed');
    };
    simulatorOps.deleteDevice = async ({ udid }) => {
      deleted = true;
      deleteCalls.push(udid);
    };
    const pool = new DevicePool({ simulatorOps, maxPool: 4 });

    await expect(
      pool.allocate({ query: { byType: 'iPhone 16 Pro' }, requestedType: 'ios.simulator' }),
    ).rejects.toThrow('simctl create was killed');

    await vi.waitFor(() => expect(deleteCalls).toContain('half-made'), { timeout: 5_000 });
    expect(pool.busyCount).toBe(0);
  });

  /**
   * @issue DTX-6232
   * The pre-create snapshot (`before`) exists because a create shares its
   * name with any already-existing sibling: rollback may only ever delete
   * what *this* create actually made. Exercising it with a non-empty raw
   * listing at snapshot time is what runs the snapshot's filter/map at all.
   */
  it('excludes a same-named pre-existing device from rollback bookkeeping', async () => {
    const { simulatorOps, deleteCalls } = fakeSimulatorOps({
      creatable,
      rawDevices: () => [{ udid: 'preexisting', name: 'iPhone 16 Pro', state: 'Shutdown' }],
    });
    const pool = new DevicePool({ simulatorOps, maxPool: 4 });

    const result = await pool.allocate({
      query: { byType: 'iPhone 16 Pro' },
      requestedType: 'ios.simulator',
    });

    expect(result.created).toBe(true);
    expect(result.udid).not.toBe('preexisting');
    expect(deleteCalls).toEqual([]);
  });

  /**
   * A create that dies before ever producing a udid must resolve its rollback
   * candidates by name — and if even that listing fails, it gives up rather
   * than guess: the original create error still surfaces, and
   * nothing is deleted.
   */
  it('gives up on rollback (without guessing) when it cannot even list leftovers', async () => {
    const { simulatorOps, deleteCalls } = fakeSimulatorOps({ creatable });
    simulatorOps.create = async () => {
      throw new Error('create failed before a udid was assigned');
    };
    let rawCalls = 0;
    simulatorOps.rawDevices = async () => {
      rawCalls += 1;
      // Call 1 is the pre-create snapshot, which must succeed for `create()`
      // to even run; only the post-failure candidate-resolution listing (call
      // 2) is the one the pool gives up on rather than guess past.
      if (rawCalls === 1) return [];
      throw new Error('listing is wedged');
    };
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const pool = new DevicePool({ simulatorOps, maxPool: 4 });

    await expect(
      pool.allocate({ query: { byType: 'iPhone 16 Pro' }, requestedType: 'ios.simulator' }),
    ).rejects.toThrow('create failed before a udid was assigned');

    expect(deleteCalls).toEqual([]);
    expect(pool.busyCount).toBe(0);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('cannot list leftovers of the failed'),
    );
    errorSpy.mockRestore();
  });

  /**
   * @issue DTX-6233
   * The retrying rollback loop: a delete CoreSimulator still
   * refuses (still materializing the half-made device) must not abandon the
   * cleanup — it retries, and once a later listing shows the device is
   * already gone it unfences the udid for picks again.
   */
  it('retries a refused rollback delete and unfences once the device is gone', async () => {
    vi.useFakeTimers();
    try {
      let rawCalls = 0;
      const leftover = { udid: 'half-made', name: 'iPhone 16 Pro', state: 'Creating' };
      const { simulatorOps, deleteCalls } = fakeSimulatorOps({
        creatable,
        rawDevices: () => {
          rawCalls += 1;
          // call 1: pre-create snapshot (nothing pre-existing);
          // call 2: post-failure candidate resolution;
          // call 3: rollback loop attempt 0 (still there — delete gets refused);
          // call 4+: rollback loop attempt 1 (gone — the retry succeeded elsewhere).
          if (rawCalls === 1) return [];
          if (rawCalls <= 3) return [leftover];
          return [];
        },
      });
      simulatorOps.create = async () => {
        throw new Error('simctl create was killed');
      };
      simulatorOps.deleteDevice = async ({ udid }) => {
        deleteCalls.push(udid);
        throw new Error('CoreSimulator refused: still materializing');
      };
      const pool = new DevicePool({ simulatorOps, maxPool: 4 });

      await expect(
        pool.allocate({ query: { byType: 'iPhone 16 Pro' }, requestedType: 'ios.simulator' }),
      ).rejects.toThrow('simctl create was killed');

      await vi.waitFor(() => expect(deleteCalls).toEqual(['half-made']));
      // Advances past the retry's real 1s backoff (faked) so attempt 1 runs
      // and observes the device gone, unfencing it.
      await vi.advanceTimersByTimeAsync(1_000);
      await vi.waitFor(() => expect(rawCalls).toBeGreaterThanOrEqual(4));
      expect(pool.busyCount).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('DevicePool.discardCreated (spec 002)', () => {
  const creatable: CreatableDeviceType = {
    deviceTypeIdentifier: 'com.apple.CoreSimulator.SimDeviceType.iPhone-16-Pro',
    runtime: { identifier: 'com.apple.CoreSimulator.SimRuntime.iOS-26-5', name: 'iOS 26.5', version: '26.5' },
  };

  it('drops the claim and deletes the device a cancelled create left behind', async () => {
    let deleted = false;
    const { simulatorOps, deleteCalls } = fakeSimulatorOps({
      creatable,
      rawDevices: () => (deleted ? [] : [{ udid: 'created-1', name: 'iPhone 16 Pro', state: 'Booted' }]),
    });
    simulatorOps.deleteDevice = async ({ udid }) => {
      deleted = true;
      deleteCalls.push(udid);
    };
    const pool = new DevicePool({ simulatorOps, maxPool: 4 });

    const result = await pool.allocate({
      query: { byType: 'iPhone 16 Pro' },
      requestedType: 'ios.simulator',
    });
    expect(result.created).toBe(true);

    pool.discardCreated(result.udid, result.allocationId);
    expect(pool.busyCount).toBe(0);

    await vi.waitFor(() => expect(deleteCalls).toContain(result.udid));
  });

  /**
   * Owner-checked, same as `release`: a stale id — a duplicate call, or one
   * racing a reclaim — must free and delete nothing (spec 002 test 8's
   * no-theft rule applies here too).
   */
  it('a discardCreated presenting a stale allocation id is a silent no-op', async () => {
    const { simulatorOps, deleteCalls } = fakeSimulatorOps({ creatable });
    const pool = new DevicePool({ simulatorOps, maxPool: 4 });

    const result = await pool.allocate({
      query: { byType: 'iPhone 16 Pro' },
      requestedType: 'ios.simulator',
    });

    pool.discardCreated(result.udid, 'alloc-not-mine');
    expect(pool.busyCount).toBe(1);
    expect(deleteCalls).toEqual([]);

    pool.discardCreated('udid-never-claimed', 'alloc-not-mine');
    expect(pool.busyCount).toBe(1);
  });
});

describe('DevicePool operational-state notes (spec 002)', () => {
  /**
   * @issue DTX-6223
   * A request-driven transition is pushed to the client immediately, and the
   * pool's own note of the transition wins over the reconcile loop's stale
   * sample when the device is next handed out.
   */
  it('pushes a request-driven transition to the notifier and patches the tracked state', async () => {
    const { simulatorOps } = fakeSimulatorOps({ devices: [device('iPhone 17', 'udid-a')] });
    const pool = new DevicePool({ simulatorOps, maxPool: 4 });

    const claim = await pool.allocate({ query: {} });
    const pushes: string[] = [];
    pool.attachNotifier(claim.allocationId, (state) => pushes.push(state));

    pool.noteOperationalState(claim.allocationId, 'booted');
    expect(pushes).toEqual(['booted']);

    pool.release('udid-a', claim.allocationId);
    const again = await pool.allocate({ query: {} });
    // The fake listing always reports 'Shutdown' — the pool's own note of the
    // boot must win over that stale sample when handing the device back out.
    expect(again.device.state).toBe('Booted');
  });

  it('is a silent no-op for an allocation id nobody holds', () => {
    const { simulatorOps } = fakeSimulatorOps();
    const pool = new DevicePool({ simulatorOps, maxPool: 4 });

    expect(() => pool.noteOperationalState('alloc-nobody', 'booted')).not.toThrow();
  });
});

describe('DevicePool eviction failure handling', () => {
  /**
   * @issue DTX-6230
   * A refused eviction shutdown must not silently drop the device from the
   * pool's own accounting — it is still physically booted, still capacity
   * this life is holding, so it goes back into the warm set rather than
   * leaking out untracked.
   */
  it('re-warms an evicted device when its shutdown attempt fails', async () => {
    const { simulatorOps, shutdownCalls } = fakeSimulatorOps({
      devices: [device('A', 'udid-a'), device('B', 'udid-b'), device('C', 'udid-c')],
    });
    simulatorOps.shutdown = async ({ udid }) => {
      shutdownCalls.push(udid);
      throw new Error('simctl shutdown refused');
    };
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const pool = new DevicePool({ simulatorOps, maxPool: 2 });
      const only = (udid: string) => (d: DeviceInfo) => d.udid === udid;

      const a = await pool.allocate({ query: {}, filter: only('udid-a') });
      pool.noteState('udid-a', 'Booted');
      pool.release('udid-a', a.allocationId);
      await new Promise((resolve) => setTimeout(resolve, 5));

      const b = await pool.allocate({ query: {}, filter: only('udid-b') });
      pool.noteState('udid-b', 'Booted');
      pool.release('udid-b', b.allocationId);

      const c = await pool.allocate({ query: {}, filter: only('udid-c') });
      expect(c.udid).toBe('udid-c');

      await vi.waitFor(() => expect(shutdownCalls).toEqual(['udid-a']));
      await vi.waitFor(() =>
        expect(errorSpy).toHaveBeenCalledWith(
          '[server] eviction shutdown failed for',
          'udid-a',
          expect.any(Error),
        ),
      );
    } finally {
      errorSpy.mockRestore();
    }
  });
});

describe('DevicePool.touch', () => {
  it('marks the allocation as just-used, resetting the idle age reported at release', async () => {
    vi.useFakeTimers();
    try {
      const { simulatorOps } = fakeSimulatorOps({ devices: [device('iPhone 17', 'udid-a')] });
      const pool = new DevicePool({ simulatorOps, maxPool: 4 });
      const claim = await pool.allocate({ query: {} });

      await vi.advanceTimersByTimeAsync(50);
      pool.touch(claim.allocationId);
      await vi.advanceTimersByTimeAsync(50);

      const outcome = pool.release('udid-a', claim.allocationId);
      // Held the whole ~100ms, but idle only since the touch ~50ms ago.
      expect(outcome?.heldMs).toBeGreaterThanOrEqual(95);
      expect(outcome?.idleMs).toBeLessThan(60);
      expect(outcome?.idleMs ?? Infinity).toBeLessThan(outcome?.heldMs ?? 0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('is a silent no-op for an allocation id nobody holds', () => {
    const { simulatorOps } = fakeSimulatorOps();
    const pool = new DevicePool({ simulatorOps, maxPool: 4 });

    expect(() => pool.touch('alloc-nobody')).not.toThrow();
  });
});

describe('DevicePool.start (reconcile loop, spec 002)', () => {
  /**
   * `start()` runs one reconcile pass immediately (the startup inventory
   * line) and then keeps ticking on its own interval — the periodic tick is
   * a distinct code path from the initial one, and both must actually run to
   * exercise the loop's own scheduling, not just its body.
   *
   * @issue DTX-2007
   * The push is sampled: the server polls the ground truth
   * and pushes only when it differs from what the client was last told — a
   * tick that finds no divergence pushes nothing, ever again for the same
   * state.
   */
  it('pushes an out-of-band state change on the very first tick, and keeps ticking on interval', async () => {
    vi.useFakeTimers();
    try {
      // The device is reported 'Shutdown' by every listing — including the
      // one the reconcile loop performs — while the client was last told
      // 'booted' (attachNotifier's baseline), so the very first tick must
      // notice the divergence and push a correction.
      const { simulatorOps } = fakeSimulatorOps({ devices: [device('iPhone 17', 'udid-a')] });
      const pool = new DevicePool({ simulatorOps, maxPool: 4 });
      const claim = await pool.allocate({ query: {} });
      const pushes: string[] = [];
      pool.attachNotifier(claim.allocationId, (state) => pushes.push(state));

      pool.start();
      await vi.waitFor(() => expect(pushes).toEqual(['shutdown']));

      // A second, interval-driven tick: nothing new to say (already told),
      // so no further push — but the interval callback itself must have run.
      await vi.advanceTimersByTimeAsync(800);
      expect(pushes).toEqual(['shutdown']);

      pool.stop();
    } finally {
      vi.useRealTimers();
    }
  });

  it('start() is idempotent — calling it twice does not double the reconcile loop', async () => {
    const { simulatorOps, listCalls } = fakeSimulatorOps({ devices: [] });
    const pool = new DevicePool({ simulatorOps, maxPool: 4 });

    pool.start();
    pool.start();
    await vi.waitFor(() => expect(listCalls()).toBeGreaterThan(0));
    const afterFirstTick = listCalls();

    pool.stop();
    // stop() must actually clear the timer: no further ticks after this.
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(listCalls()).toBe(afterFirstTick);
  });
});
