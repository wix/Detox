/**
 * The iOS driver's own test harness: a driver over a fake `SimulatorOps`,
 * built the way the server builds it — through `createDriver(toolkit)` — on
 * a toolkit whose gateway is the real library on ephemeral ports and whose
 * log is a recorder the tests may spy on.
 */
import { AbortError, DetoxError, DetoxErrorCode } from '@detox-remote/core';
import { AppGateway, type DriverLog, type DriverToolkit } from '@detox-remote/server';

import { createDriver } from '../index';
import type { DevicePool } from '../DevicePool';
import type { IosSimulatorDriver } from '../IosSimulatorDriver';
import type { SimulatorOps } from '../SimulatorOps';

/** The log every harness-built driver writes to — spy on it. */
export const testLog: DriverLog = {
  error: () => undefined,
  warn: () => undefined,
  info: () => undefined,
  debug: () => undefined,
};

/** A toolkit like the server's, minus the request tracing (no request scope in a unit test). */
export function testToolkit(maxPool = 4): DriverToolkit {
  return {
    appGateway: { listen: (options) => AppGateway.listen(options) },
    exec: () => Promise.reject(new Error('the harness spawns nothing — fake SimulatorOps instead')),
    errors: { DetoxError, DetoxErrorCode, AbortError },
    log: testLog,
    maxPool,
  };
}

export interface IosPoolHandle {
  pool: DevicePool;
  driver: IosSimulatorDriver;
  close(): Promise<void>;
}

/** The driver's {@link DevicePool} over a fake `SimulatorOps` (for the pool's own unit tests). */
export function iosPool(simulatorOps: SimulatorOps, maxPool = 4): IosPoolHandle {
  const driver = createDriver(testToolkit(maxPool), { simulatorOps, preferredPort: 0 }) as IosSimulatorDriver;
  return { pool: driver.pool, driver, close: () => driver.close() };
}
