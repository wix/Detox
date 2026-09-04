/**
 * Test harness for the spec-015 driver seam: wraps a fake `SimulatorOps` in the
 * built-in iOS driver (`@detox-remote/driver-ios`) and a {@link DriverHost},
 * so the server unit tests keep faking `simctl` while the core talks to a
 * driver and a per-device gateway (ephemeral ports in tests, never the native
 * 8099). The driver is built through the same `createDriver(toolkit)` door the
 * server itself uses.
 */
import { createDriver, type DevicePool, type IosSimulatorDriver, type SimulatorOps } from '@detox-remote/driver-ios';

import { DriverHost, BUILTIN_DEVICE_TYPE } from '../drivers';

export interface IosHostOptions {
  maxPool?: number;
  simulatorDevicesRoot?: string;
  loginDeadlineMs?: number;
}

export interface IosHost {
  driver: IosSimulatorDriver;
  host: DriverHost;
  /** The iOS driver's own pool — reached for its bookkeeping (`busyCount`, `markUnknown`). */
  pool: DevicePool;
  close(): Promise<void>;
}

/** Builds a driver host around a fake `SimulatorOps`, on ephemeral gateway ports. */
export function iosHost(simulatorOps: SimulatorOps, options: IosHostOptions = {}): IosHost {
  const maxPool = options.maxPool ?? 4;
  let driver: IosSimulatorDriver | undefined;
  const host = new DriverHost({
    maxPool,
    builtin: [
      {
        type: BUILTIN_DEVICE_TYPE,
        createDriver: (toolkit) => {
          driver = createDriver(toolkit, {
            simulatorOps,
            preferredPort: 0,
            simulatorDevicesRoot: options.simulatorDevicesRoot,
            loginDeadlineMs: options.loginDeadlineMs,
          }) as IosSimulatorDriver;
          return driver;
        },
      },
    ],
  });
  if (!driver) throw new Error('the built-in driver was not created');
  return { driver, host, pool: driver.pool, close: () => host.close() };
}

export interface IosPoolHandle {
  pool: DevicePool;
  close(): Promise<void>;
}

/** The iOS driver's pool alone, for a server test that reasons about the pool across server lives. */
export function iosPool(simulatorOps: SimulatorOps, maxPool = 4): IosPoolHandle {
  const handle = iosHost(simulatorOps, { maxPool });
  return { pool: handle.pool, close: () => handle.close() };
}
