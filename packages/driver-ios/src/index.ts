/**
 * `@detox-remote/driver-ios` — the built-in `ios.simulator` driver (spec
 * 015), a package like any driver's: the server registers it through the
 * same `createDriver(toolkit)` door an npm driver comes through, and
 * everything it needs of the server — the gateway library, the child-process
 * runner, the log, the typed errors, `--max-pool` — arrives on the toolkit.
 * Its dependency on `@detox-remote/server` is type-only (the seam's
 * contract, what a published driver reads from `detox/server`).
 */
import type { DeviceDriver, DriverToolkit } from '@detox-remote/server';

import { IosSimulatorDriver } from './IosSimulatorDriver';
import { SimulatorOps } from './SimulatorOps';

/** What the server's own wiring may hand the built-in beyond the toolkit: its test seam and its framework override. */
export interface CreateIosDriverOptions {
  /** @internal test seam: a fake `simctl`/`applesimutils`. */
  simulatorOps?: SimulatorOps;
  /** Explicit Detox iOS framework binary (`DETOX_IOS_FRAMEWORK_PATH`). */
  iosFrameworkPath?: string;
  /** @internal test seams — see {@link IosSimulatorDriverOptions}. */
  simulatorDevicesRoot?: string;
  preferredPort?: number;
  loginDeadlineMs?: number;
}

/** The one export a driver package must have (spec 015). */
export function createDriver(toolkit: DriverToolkit, options: CreateIosDriverOptions = {}): DeviceDriver {
  return new IosSimulatorDriver({
    simulatorOps: options.simulatorOps ?? new SimulatorOps({ exec: toolkit.exec }),
    maxPool: toolkit.maxPool,
    listen: (listenOptions) => toolkit.appGateway.listen(listenOptions),
    log: toolkit.log,
    iosFrameworkPath: options.iosFrameworkPath,
    simulatorDevicesRoot: options.simulatorDevicesRoot,
    preferredPort: options.preferredPort,
    loginDeadlineMs: options.loginDeadlineMs,
  });
}

export { IosSimulatorDriver, NATIVE_DEFAULT_PORT, type IosSimulatorDriverOptions } from './IosSimulatorDriver';
export {
  DevicePool,
  type AllocateArgs,
  type AllocateResult,
  type CreatableDevice,
  type DevicePoolDeps,
  type PoolCreateArgs,
  type PoolDeviceArgs,
  type PoolDriver,
  type PoolListArgs,
  type PoolSignalArgs,
  type RawPoolDevice,
  toRuntimeState,
} from './DevicePool';
export * from './SimulatorOps';
export { FRAMEWORK_PATH_ENV, defaultFrameworkCacheDir, resolveIosFrameworkPath } from './framework-cache';
export {
  AppOutputCapture,
  DEFAULT_SIMULATOR_DEVICES_ROOT,
  appOutputPaths,
  ensureAppOutputDir,
  type AppOutputCaptureInit,
  type AppOutputPaths,
} from './app-output';
