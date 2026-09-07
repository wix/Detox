/**
 * The driver host (spec 015): `device.type` is a Detox 20 legacy name or an
 * npm package specifier the server imports the way any module imports a
 * package (`import 'lodash/map'`) — Node's own resolution from where the
 * server runs, on the first `allocateDevice` that names it, cached for the
 * server's life. `ios.simulator` is built in; the other legacy names are
 * reserved with no driver here. Path-shaped specifiers are refused before any
 * import: a request may name a package the operator installed, never a file on
 * the disk (auth is off by default).
 *
 * The host is a registry and nothing more: it holds no pool and no device —
 * a platform's pooling is its driver's (spec 015). `--max-pool` is handed to
 * every driver on the toolkit; what it bounds is the driver's call.
 */
import { AbortError, DetoxError, DetoxErrorCode, NoMatchingDeviceError } from '@detox-remote/core';

import { AppGateway, type AppGatewayOptions } from './AppGateway';
import type { DeviceDriver, DriverModule, DriverToolkit } from './driver';
import { execWithRetries } from './exec';
import { describeError, serverLog } from './log-sink';

/** Detox 20's own device types (`composeDeviceConfig.js:311-333`). */
export const LEGACY_DEVICE_TYPES = ['ios.simulator', 'android.emulator', 'android.attached', 'android.genycloud'] as const;

/** The one legacy name with a driver in this repository. */
export const BUILTIN_DEVICE_TYPE = 'ios.simulator';

/**
 * A driver the server ships with. Registered through the same
 * `createDriver(toolkit)` an npm driver comes through — built synchronously
 * at construction, shape-checked like an import — or, for a unit test's
 * stand-in, handed over ready-made.
 */
export type BuiltinDriverEntry =
  | { type: string; createDriver: (toolkit: DriverToolkit) => DeviceDriver }
  | { type: string; driver: DeviceDriver };

export interface DriverHostOptions {
  /** The server's `--max-pool`, handed to every driver on its toolkit. */
  maxPool: number;
  builtin?: readonly BuiltinDriverEntry[];
  /** @internal test seam over the dynamic import (production: Node's own `import()`). */
  importer?: (specifier: string) => Promise<unknown>;
}

export interface ResolvedDriver {
  type: string;
  driver: DeviceDriver;
}

/**
 * Path-shaped or URL-shaped: `./…`, `../…`, `/…`, `~…`, a `..` segment, a
 * backslash, a scheme. Everything else is a bare specifier Node resolves
 * from the server's own location.
 */
export function isPathShaped(specifier: string): boolean {
  return (
    specifier.length === 0 ||
    /^\.{1,2}(\/|$)/.test(specifier) ||
    specifier.startsWith('/') ||
    specifier.startsWith('~') ||
    specifier.includes('\\') ||
    /(^|\/)\.\.(\/|$)/.test(specifier) ||
    /^[a-z][a-z0-9+.-]*:/i.test(specifier) ||
    /\s/.test(specifier)
  );
}

const refuseType = (message: string, type: string, reason: string, cause?: unknown): NoMatchingDeviceError =>
  new NoMatchingDeviceError(message, { details: { reason, type, requestedType: type }, cause });

export class DriverHost {
  private readonly _maxPool: number;
  private readonly _importer: (specifier: string) => Promise<unknown>;
  private readonly _entries = new Map<string, ResolvedDriver>();
  /** In-flight imports, so two concurrent allocations of one type share the import. */
  private readonly _pending = new Map<string, Promise<ResolvedDriver>>();
  private _started = false;
  private _closed = false;

  constructor({ maxPool, builtin = [], importer }: DriverHostOptions) {
    this._maxPool = maxPool;
    this._importer = importer ?? ((specifier) => import(specifier));
    for (const entry of builtin) {
      const driver = 'driver' in entry ? entry.driver : entry.createDriver(this._toolkit());
      if (!isDriverShaped(driver)) {
        throw new Error(`built-in driver "${entry.type}" is not a driver (needs allocate/close)`);
      }
      this._entries.set(entry.type, { type: entry.type, driver });
    }
  }

  /** Every driver this host holds right now — built-ins, and whatever was imported so far. */
  get drivers(): readonly ResolvedDriver[] {
    return [...this._entries.values()];
  }

  /** Starts every driver's background work; a driver imported later starts on import. */
  start(): void {
    this._started = true;
    for (const entry of this._entries.values()) entry.driver.start?.();
  }

  stop(): void {
    this._started = false;
    for (const entry of this._entries.values()) entry.driver.stop?.();
  }

  /** Stops every driver and closes it (its device objects, listeners, sockets). */
  async close(): Promise<void> {
    this._closed = true;
    this.stop();
    for (const entry of this._entries.values()) {
      try {
        await entry.driver.close();
      } catch (err) {
        serverLog.error(`driver "${entry.type}" failed to close: ${describeError(err)}`);
      }
    }
  }

  /**
   * The driver behind a wire `type`, or a typed refusal: a reserved legacy
   * name, a path-shaped specifier, a package that cannot be imported, and a
   * module without a `createDriver` all answer `DETOX_NO_MATCHING_DEVICE`
   * (2002, what frozen 002 pins for an unmatched type; a relay advances its
   * fan-out on it) with `details.reason` telling them apart.
   */
  async resolve(type: unknown): Promise<ResolvedDriver> {
    if (typeof type !== 'string' || type.length === 0) {
      throw new DetoxError('allocateDevice requires a string "type"', {
        code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
        details: { method: 'allocateDevice', parameter: 'type' },
      });
    }
    const known = this._entries.get(type);
    if (known) return known;
    if ((LEGACY_DEVICE_TYPES as readonly string[]).includes(type)) {
      throw refuseType(
        `No driver for device type "${type}" on this server — it is a reserved Detox 20 name with no driver in this release`,
        type,
        'unknown-type',
      );
    }
    if (isPathShaped(type)) {
      throw refuseType(
        `Device type "${type}" is path-shaped — a device type names an installed package (like an import specifier), never a file`,
        type,
        'path-shaped',
      );
    }
    let pending = this._pending.get(type);
    if (!pending) {
      pending = this._import(type).finally(() => this._pending.delete(type));
      this._pending.set(type, pending);
    }
    return pending;
  }

  private async _import(type: string): Promise<ResolvedDriver> {
    if (this._closed) {
      throw refuseType(`Device type "${type}" cannot be loaded: the server is closing`, type, 'unknown-type');
    }
    let loaded: unknown;
    try {
      loaded = await this._importer(type);
    } catch (err) {
      throw refuseType(
        `No driver for device type "${type}": the server could not import it (${describeError(err)}) — install the package where the server runs`,
        type,
        'unknown-type',
        err,
      );
    }
    const factory = driverFactoryOf(loaded);
    if (!factory) {
      throw refuseType(
        `"${type}" imported but exports no driver: a driver package exports \`createDriver(toolkit)\``,
        type,
        'not-a-driver',
      );
    }
    let driver: DeviceDriver;
    try {
      driver = await factory(this._toolkit());
    } catch (err) {
      throw refuseType(
        `"${type}" refused to create its driver: ${describeError(err)}`,
        type,
        'not-a-driver',
        err,
      );
    }
    if (!isDriverShaped(driver)) {
      throw refuseType(
        `"${type}" createDriver returned something that is not a driver (needs allocate/close)`,
        type,
        'not-a-driver',
      );
    }
    if (this._closed) {
      // `close()` walked `_entries` while this import was in flight: nobody
      // else will close what the factory just made.
      await driver.close().catch((err: unknown) => serverLog.error(`driver "${type}" failed to close: ${describeError(err)}`));
      throw refuseType(`Device type "${type}" cannot be loaded: the server is closing`, type, 'unknown-type');
    }
    // Concurrent resolves of one type share `_pending` (one import), and a
    // built-in name is served before `_import` is ever reached, so by here no
    // other writer can have claimed this entry.
    const entry: ResolvedDriver = { type, driver };
    this._entries.set(type, entry);
    if (this._started) driver.start?.();
    serverLog.info(`driver "${type}" imported`, { type });
    return entry;
  }

  private _toolkit(): DriverToolkit {
    return {
      appGateway: { listen: (options?: AppGatewayOptions) => AppGateway.listen(options) },
      exec: execWithRetries,
      errors: { DetoxError, DetoxErrorCode, AbortError },
      log: {
        error: (message, fields) => serverLog.error(message, fields),
        warn: (message, fields) => serverLog.warn(message, fields),
        info: (message, fields) => serverLog.info(message, fields),
        debug: (message, fields) => serverLog.debug(message, fields),
      },
      maxPool: this._maxPool,
    };
  }
}

function driverFactoryOf(loaded: unknown): DriverModule['createDriver'] | undefined {
  if (typeof loaded !== 'object' || loaded === null) return undefined;
  const mod = loaded as Partial<DriverModule> & { default?: Partial<DriverModule> };
  if (typeof mod.createDriver === 'function') return mod.createDriver.bind(mod);
  const dflt = mod.default;
  if (typeof dflt === 'object' && dflt !== null && typeof dflt.createDriver === 'function') {
    return dflt.createDriver.bind(dflt);
  }
  return undefined;
}

function isDriverShaped(value: unknown): value is DeviceDriver {
  if (typeof value !== 'object' || value === null) return false;
  const driver = value as Partial<DeviceDriver>;
  return typeof driver.allocate === 'function' && typeof driver.close === 'function';
}
