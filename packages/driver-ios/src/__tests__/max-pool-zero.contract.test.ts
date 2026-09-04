/**
 * The `--max-pool 0` fixture contract (spec 008): a node with `--max-pool 0` is "the
 * permanently exhausted node that owns nothing" — a valid byId query answers
 * `DETOX_POOL_EXHAUSTED` (2001) and an impossible one answers `DETOX_NO_MATCHING_DEVICE`
 * (2002), and the node never touches a simulator. Composition of two DevicePool
 * disciplines: match first, cap second (`_allocateExclusively`) — terminality still wins
 * over a full pool; and a byId query is never creatable (`_creatable`) — a zero-match byId
 * refuses terminal instead of spawning a look-alike. A future "reject --max-pool 0 at
 * startup" hardening must fail this suite, not silently kill spec 008's fixtures.
 */
import { describe, it, expect } from 'vitest';
import type { DeviceInfo } from '../SimulatorOps';

import type { DevicePool } from '../DevicePool';
import type { DeviceTargetArgs, SimulatorOps } from '../SimulatorOps';
import { iosPool } from './_harness';

const PROBE_UDID = 'AAAA0000-0000-4000-8000-000000000001';

interface TouchLog {
  boots: string[];
  shutdowns: string[];
  creates: number;
}

interface ZeroPool {
  pool: DevicePool;
  touched: TouchLog;
}

function zeroPool(devices: DeviceInfo[]): ZeroPool {
  const touched: TouchLog = { boots: [], shutdowns: [], creates: 0 };
  const simulatorOps = {
    list: async () => {
      await Promise.resolve();
      return devices;
    },
    rawDevices: async () => [],
    creatableDeviceType: async () => undefined,
    create: async () => {
      touched.creates += 1;
      return 'created-udid';
    },
    boot: async ({ udid }: DeviceTargetArgs) => {
      touched.boots.push(udid);
      return true;
    },
    shutdown: async ({ udid }: DeviceTargetArgs) => {
      touched.shutdowns.push(udid);
      return true;
    },
  } as unknown as SimulatorOps;
  return { pool: iosPool(simulatorOps, 0).pool, touched };
}

describe('the --max-pool 0 contract (spec 008 fixture policy)', () => {
  it('a valid byId query answers 2001 — match runs BEFORE the cap, so the refusal is honest', async () => {
    const probe = {
      name: 'detox-spec008-probe',
      udid: PROBE_UDID,
      state: 'Shutdown',
      os: { platform: 'iOS', name: 'iOS 26.5' },
    } as DeviceInfo;
    const { pool, touched } = zeroPool([probe]);
    await expect(
      pool.allocate({ allocationId: 'alloc-test', query: { byId: PROBE_UDID }, requestedType: 'ios.simulator' }),
    ).rejects.toMatchObject({ code: 2001 });
    expect(touched.boots).toEqual([]);
    expect(touched.shutdowns).toEqual([]);
    expect(touched.creates).toBe(0);
  });

  it('an impossible byId query answers 2002 — byId is NEVER creatable, so terminality survives the cap', async () => {
    const { pool, touched } = zeroPool([]);
    await expect(
      pool.allocate({
        allocationId: 'alloc-test', query: { byId: 'DEAD0000-0000-4000-8000-000000000000' },
        requestedType: 'ios.simulator',
      }),
    ).rejects.toMatchObject({ code: 2002 });
    expect(touched.creates).toBe(0);
  });

  it('a creatable model query still refuses on capacity (2001) without creating', async () => {
    // The cap check runs before the create for zero-match creatable queries
    // too — a zero-pool node must never boot OR create anything.
    let creates = 0;
    const simulatorOps = {
      list: async () => [],
      rawDevices: async () => [],
      creatableDeviceType: async () => ({
        deviceTypeIdentifier: 'com.apple.iPhone17',
        runtime: { identifier: 'iOS-26', version: '26.5', name: 'iOS 26.5' },
      }),
      create: async () => {
        creates += 1;
        return 'created-udid';
      },
    } as unknown as SimulatorOps;
    const capped = iosPool(simulatorOps, 0).pool;
    await expect(
      capped.allocate({ allocationId: 'alloc-test', query: { byType: 'iPhone 17' }, requestedType: 'ios.simulator' }),
    ).rejects.toMatchObject({ code: 2001 });
    expect(creates).toBe(0);
  });
});
