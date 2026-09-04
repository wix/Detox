/**
 * The built-in `ios.simulator` driver (spec 015): everything CoreSimulator
 * about a device, behind the seam — the pool (warm devices, LRU eviction,
 * create-on-miss, the reconcile loop; `DevicePool.ts`), `simctl`/
 * `applesimutils` through {@link SimulatorOps}, the injected launch, the
 * app's own output capture (spec 013), `cleanBoot`, the wipe choreography
 * (spec 005), and one app gateway per booted simulator that prefers the
 * native default port so an app started from Xcode with zero launch
 * arguments (`ws://localhost:8099`, `DetoxManager.swift:126`) finds it.
 *
 * The core sees none of it: it asks `allocate` for a device and gets a
 * {@link DeviceLease} whose descriptor is `{udid}` and whose verbs it calls.
 */
import { randomUUID } from 'node:crypto';

import { AbortError, DetoxError, DetoxErrorCode } from '@detox-remote/core';
import type { DeviceRuntimeState } from '@detox-remote/protocol';
import type {
  AppGateway,
  AppGatewayOptions,
  DeviceDriver,
  DeviceLease,
  DeviceLeaseInfo,
  DriverAllocateArgs,
  DriverBiometricEnrollmentArgs,
  DriverBiometricMatchArgs,
  DriverBootArgs,
  DriverBundleArgs,
  DriverInstallArgs,
  DriverLaunchArgs,
  DriverLaunchResult,
  DriverLog,
  DriverOpenUrlArgs,
  DriverPermissionsArgs,
  DriverSetLocationArgs,
  DriverSignalArgs,
  DriverStatusBarArgs,
  DriverTerminateArgs,
  DriverWipeArgs,
} from '@detox-remote/server';

import {
  AppOutputCapture,
  appOutputPaths,
  ensureAppOutputDir,
  DEFAULT_SIMULATOR_DEVICES_ROOT,
} from './app-output';
import {
  DevicePool,
  type AllocateResult,
  type CreatableDevice,
  type PoolCreateArgs,
  type PoolDeviceArgs,
  type PoolDriver,
  type PoolListArgs,
  type PoolSignalArgs,
  type RawPoolDevice,
} from './DevicePool';
import { TEARDOWN_TIMEOUT_MS, unknownStateIfKilled, type DeviceInfo, type SimulatorOps } from './SimulatorOps';

/** The public dialect's device query for `ios.simulator` (`DeviceQuery` in `detox/client`), read defensively. */
interface IosDeviceQuery {
  deviceId?: unknown;
  model?: unknown;
  os?: unknown;
}

/** The `{udid, signal}` pair the driver's own per-device helpers take. */
interface UdidArgs {
  udid: string;
  signal?: AbortSignal;
}

/** The wipe's erase leg: a udid and nothing else — never a caller's signal (spec 005). */
interface EraseArgs {
  udid: string;
}

/** What a lease is built from: the driver, its pool, and the pool's claim. */
interface LeaseInit {
  driver: IosSimulatorDriver;
  pool: DevicePool;
  result: AllocateResult;
}

/** The frozen natives' default app-facing port (`DetoxManager.swift:126`, `DetoxServerInfo.kt:8`). */
export const NATIVE_DEFAULT_PORT = 8099;

export interface IosSimulatorDriverOptions {
  simulatorOps: SimulatorOps;
  /** The server's `--max-pool`: simulators held plus kept warm. */
  maxPool: number;
  /** The gateway library, off the toolkit: one listener per booted simulator. */
  listen: (options?: AppGatewayOptions) => Promise<AppGateway>;
  /** The server's log, off the toolkit. */
  log: DriverLog;
  /** Explicit injectable framework binary (`DETOX_IOS_FRAMEWORK_PATH`); absent → v20's cache, else a typed 2009. */
  iosFrameworkPath?: string;
  /** @internal test seam: where a simulator's `data/tmp` lives (CoreSimulator's per-user devices root in production). */
  simulatorDevicesRoot?: string;
  /** @internal test seam: the port each device listener tries first (the native default in production). */
  preferredPort?: number;
  /** @internal test seam over the gateway's silent-socket reap. */
  loginDeadlineMs?: number;
}

/**
 * One booted simulator's own object: its gateway, and the launch-free proof
 * the terminate-first skip rests on.
 */
class IosSimulatorDevice {
  readonly udid: string;
  readonly apps: AppGateway;
  /**
   * The driver itself performed the last physical boot of this device with no
   * launches since, so `launch` may skip its terminate-first step: a terminate
   * right after a cold boot can wedge CoreSimulator until the deadline kills
   * it. Cleared by anything that can start a process (`launch`, a resume,
   * `openUrl`, `sendToHome`) and by any accepted login (an app the server
   * never launched is running — spec 015); restored by a physical boot,
   * guarded by {@link launchSeq} against a launch that landed mid-boot.
   */
  cleanBoot = false;
  /** Monotonic launch count; keeps a `boot` completing after a concurrent launch from restoring {@link cleanBoot} over a running process. */
  launchSeq = 0;

  constructor(udid: string, apps: AppGateway) {
    this.udid = udid;
    this.apps = apps;
    apps.onLogin(() => {
      this.cleanBoot = false;
    });
  }
}

export class IosSimulatorDriver implements DeviceDriver, PoolDriver {
  /** @internal The simulator pool — reached by the server's unit tests to read its bookkeeping. */
  readonly pool: DevicePool;
  readonly log: DriverLog;
  private readonly _listen: (options?: AppGatewayOptions) => Promise<AppGateway>;
  private readonly _ops: SimulatorOps;
  private readonly _iosFrameworkPath: string | undefined;
  private readonly _devicesRoot: string;
  private readonly _preferredPort: number;
  private readonly _loginDeadlineMs: number | undefined;
  /** Device objects by udid — the promise, so two concurrent asks share one listener. */
  private readonly _devices = new Map<string, Promise<IosSimulatorDevice>>();
  /** The port each device's listener last had: a re-listen after shutdown → boot prefers it, so `apps.serverUrl` survives the cycle. */
  private readonly _lastPort = new Map<string, number>();

  constructor({ simulatorOps, maxPool, listen, log, iosFrameworkPath, simulatorDevicesRoot, preferredPort, loginDeadlineMs }: IosSimulatorDriverOptions) {
    this._ops = simulatorOps;
    this._listen = listen;
    this.log = log;
    this._iosFrameworkPath = iosFrameworkPath;
    this._devicesRoot = simulatorDevicesRoot ?? DEFAULT_SIMULATOR_DEVICES_ROOT;
    this._preferredPort = preferredPort ?? NATIVE_DEFAULT_PORT;
    this._loginDeadlineMs = loginDeadlineMs;
    this.pool = new DevicePool({ driver: this, maxPool, log });
  }

  // ── the seam (DeviceDriver) ─────────────────────────────────────────────

  /**
   * Match, claim, boot (spec 002): the pool picks — a warm device first —
   * and the boot runs here so a caller that walks away mid-boot leaves
   * nothing behind: the claim is unwound the way a cancelled allocation is.
   */
  async allocate({ allocationId, device, requestedType, signal, onBootStart }: DriverAllocateArgs): Promise<DeviceLease> {
    const query = this.query(device);
    const result = await this.pool.allocate({ allocationId, query, signal, requestedType });
    const lease = new IosSimulatorLease({ driver: this, pool: this.pool, result });
    try {
      await lease.initialBoot({ signal, onBootStart });
    } catch (err) {
      // The boot failed or was cancelled: the original error is the story;
      // the compensation's own failure would only obscure it.
      await lease.discard().catch(() => undefined);
      throw err;
    }
    return lease;
  }

  start(): void {
    this.pool.start();
  }

  stop(): void {
    this.pool.stop();
  }

  async close(): Promise<void> {
    for (const udid of [...this._devices.keys()]) await this._closeDevice(udid);
  }

  /** The public dialect's query (`{deviceId, model, os}`) → applesimutils' `--byId/--byType/--byOS`. */
  query(device: unknown): Record<string, string> {
    if (device !== undefined && (typeof device !== 'object' || device === null || Array.isArray(device))) {
      throw new DetoxError('allocateDevice "device" must be an object query for ios.simulator', {
        code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
        details: { method: 'allocateDevice', parameter: 'device' },
      });
    }
    const d = (device ?? {}) as IosDeviceQuery;
    const query: Record<string, string> = {};
    if (typeof d.deviceId === 'string' && d.deviceId) query.byId = d.deviceId;
    // @issue DTX-3008: the public dialect's `model` is applesimutils' `type`.
    if (typeof d.model === 'string' && d.model) query.byType = d.model;
    if (typeof d.os === 'string' && d.os) query.byOS = d.os;
    return query;
  }

  // ── the pool's view (PoolDriver) ────────────────────────────────────────

  async list({ query, signal }: PoolListArgs): Promise<DeviceInfo[]> {
    const devices = await this._ops.list({ query, signal });
    // Only iOS simulators back this driver; applesimutils lists every platform.
    return devices.filter((device) => device.os?.platform === 'iOS');
  }

  async boot({ udid, signal, onBootStart }: UdidArgs & DriverBootArgs): Promise<boolean> {
    const existing = await this._existing(udid);
    const launchSeqBefore = existing?.launchSeq ?? 0;
    const didBoot = await this._ops.boot({ udid, signal, onBootStart });
    const device = await this.device(udid);
    // Only a physical boot proves launch-free — a launch that landed mid-boot (launchSeq moved) spoils the proof.
    if (didBoot && device.launchSeq === launchSeqBefore) device.cleanBoot = true;
    return didBoot;
  }

  async shutdown({ udid, signal }: PoolDeviceArgs): Promise<boolean> {
    try {
      return await this._ops.shutdown({ udid, signal });
    } finally {
      // The listener lives with the booted device: whatever the shutdown
      // did, the device object (sockets, sessions) goes with it.
      await this._closeDevice(udid);
    }
  }

  /** The device's object, get-or-create: exists while the device is booted. */
  device(udid: string): Promise<IosSimulatorDevice> {
    let pending = this._devices.get(udid);
    if (!pending) {
      pending = this._listen({
        preferredPort: this._lastPort.get(udid) ?? this._preferredPort,
        deviceId: udid,
        ...(this._loginDeadlineMs !== undefined ? { loginDeadlineMs: this._loginDeadlineMs } : {}),
      }).then((apps) => {
        const port = Number(new URL(apps.url).port);
        if (Number.isInteger(port) && port > 0) this._lastPort.set(udid, port);
        return new IosSimulatorDevice(udid, apps);
      });
      this._devices.set(udid, pending);
      pending.catch(() => this._devices.delete(udid));
    }
    return pending;
  }

  /**
   * Only a `byType` query is creatable: an id names one concrete device that
   * is not there, and a `byName` for anything but the model itself would
   * never match the device we would make.
   */
  async creatable({ query, signal }: PoolListArgs): Promise<CreatableDevice | undefined> {
    const model = query.byType;
    if (!model || query.byId || (query.byName && query.byName !== model)) return undefined;
    const found = await this._ops.creatableDeviceType({ model, os: query.byOS, signal });
    return found && { model, ...found };
  }

  create(args: PoolCreateArgs): Promise<string> {
    return this._ops.create(args);
  }

  async deleteDevice({ udid, signal }: PoolDeviceArgs): Promise<void> {
    await this._closeDevice(udid);
    await this._ops.deleteDevice({ udid, signal });
  }

  rawDevices(args: PoolSignalArgs = {}): Promise<RawPoolDevice[]> {
    return this._ops.rawDevices(args);
  }

  /**
   * The pool's reconcile loop saw the platform report the device down (or
   * gone) — Simulator.app quit, a manual `simctl shutdown`, a delete. The
   * gateway lives with the booted device, so its object goes;
   * a device nothing opened an object for is a no-op.
   */
  deviceWentDown(udid: string): Promise<void> {
    return this._closeDevice(udid);
  }

  // ── the device verbs, by udid (the lease binds them to its device) ──────

  /**
   * The launch choreography (spec 003): the framework resolves first
   * (before any side effect), terminate-first unless the device is known
   * launch-free, then the injected spawn with the frozen argv convention —
   * `-detoxServer` is this device's own gateway, `-detoxSessionId` what the
   * core registered. The app's own output (spec 013) is tailed from the pid
   * on; the returned stopper drains it.
   */
  async launch(args: UdidArgs & DriverLaunchArgs): Promise<DriverLaunchResult> {
    const { udid, bundleId, sessionId, serverUrl, launchArgs, languageAndLocale, payloadArgs, output, signal, onSpawn } = args;
    // Re-resolved per launch: building the v20 cache mid-session works without a server restart.
    const frameworkPath = await this._ops.resolveFrameworkPath(this._iosFrameworkPath);
    const device = await this.device(udid);
    // Terminate-first is skipped on a device the driver itself cold-booted
    // with no launches since (see `IosSimulatorDevice.cleanBoot`): nothing can
    // be running, and the terminate itself is the hazard there.
    if (!device.cleanBoot) {
      await this._ops.terminate({ udid, bundleId, signal });
    }
    // A process may have been spawned from here on — the device is no longer
    // known launch-free, and concurrent boots must not restore the flag over
    // it (launchSeq guards their set).
    device.cleanBoot = false;
    device.launchSeq += 1;

    // Built before the spawn, so a launch that fails after simctl created the
    // files still removes them; started once the pid is known.
    const paths = output ? appOutputPaths(this._devicesRoot, udid, randomUUID()) : undefined;
    if (paths) ensureAppOutputDir(paths);
    const capture =
      output && paths ? new AppOutputCapture({ paths, sink: output.sink, budgetBytes: output.budgetBytes }) : undefined;
    let pid: number;
    try {
      // The old process is dead (terminate-first) or never existed (a clean
      // boot): the core may claim the next login now, and nothing can redial
      // into it.
      onSpawn?.();
      pid = await this._ops.launch({
        udid,
        bundleId,
        launchArgs,
        languageAndLocale,
        payloadArgs,
        detox: { serverUrl, sessionId, frameworkPath },
        output: paths,
        signal,
      });
    } catch (err) {
      capture?.stop();
      throw err;
    }
    capture?.start(pid);
    return { pid, stopOutput: capture ? () => capture.stop() : undefined };
  }

  terminate({ udid, bundleId, signal, tolerateDownDevice }: UdidArgs & DriverTerminateArgs): Promise<void> {
    return this._ops.terminate({ udid, bundleId, signal, tolerateDownDevice });
  }

  /** A resume performs no new launch transaction — but `simctl launch` can start a process, so the device is no longer known launch-free. */
  async resume({ udid, bundleId, signal }: UdidArgs & DriverBundleArgs): Promise<void> {
    await this._spoilCleanBoot(udid);
    await this._ops.resume({ udid, bundleId, signal });
  }

  install({ udid, appPath, signal }: UdidArgs & DriverInstallArgs): Promise<void> {
    return this._ops.install({ udid, appPath, signal });
  }

  uninstall({ udid, bundleId, signal }: UdidArgs & DriverBundleArgs): Promise<void> {
    return this._ops.uninstall({ udid, bundleId, signal });
  }

  /** Opening a URL launches a process (the handling app, or Safari) — the device is no longer known launch-free. */
  async openUrl({ udid, url, signal }: UdidArgs & DriverOpenUrlArgs): Promise<void> {
    await this._spoilCleanBoot(udid);
    await this._ops.openUrl({ udid, url, signal });
  }

  setLocation({ udid, lat, lon, signal }: UdidArgs & DriverSetLocationArgs): Promise<void> {
    return this._ops.setLocation({ udid, lat, lon, signal });
  }

  setStatusBar({ udid, overrides, signal }: UdidArgs & DriverStatusBarArgs): Promise<void> {
    return this._ops.setStatusBar({ udid, overrides, signal });
  }

  resetStatusBar({ udid, signal }: UdidArgs): Promise<void> {
    return this._ops.resetStatusBar({ udid, signal });
  }

  setBiometricEnrollment({ udid, enabled, signal }: UdidArgs & DriverBiometricEnrollmentArgs): Promise<void> {
    return this._ops.setBiometricEnrollment({ udid, enabled, signal });
  }

  matchBiometric({ udid, kind, matched, signal }: UdidArgs & DriverBiometricMatchArgs): Promise<void> {
    return this._ops.matchBiometric({ udid, kind, matched, signal });
  }

  clearKeychain({ udid, signal }: UdidArgs): Promise<void> {
    return this._ops.clearKeychain({ udid, signal });
  }

  /** The wipe's erase leg: takes no signal by contract — never killed by a caller (spec 005). */
  erase({ udid }: EraseArgs): Promise<void> {
    return this._ops.erase({ udid });
  }

  /** The SpringBoard proxy launches Settings — the device is no longer known launch-free. */
  async sendToHome({ udid, signal }: UdidArgs): Promise<void> {
    await this._spoilCleanBoot(udid);
    await this._ops.sendToHome({ udid, signal });
  }

  setPermissions({ udid, bundleId, permissions, signal }: UdidArgs & DriverPermissionsArgs): Promise<void> {
    return this._ops.setPermissions({ udid, bundleId, permissions, signal });
  }

  private async _existing(udid: string): Promise<IosSimulatorDevice | undefined> {
    const pending = this._devices.get(udid);
    if (!pending) return undefined;
    try {
      return await pending;
    } catch {
      // A device whose gateway failed to open is not a device we can spoil.
      return undefined;
    }
  }

  private async _spoilCleanBoot(udid: string): Promise<void> {
    const device = await this._existing(udid);
    if (device) device.cleanBoot = false;
  }

  private async _closeDevice(udid: string): Promise<void> {
    const pending = this._devices.get(udid);
    if (!pending) return;
    this._devices.delete(udid);
    let device: IosSimulatorDevice;
    try {
      device = await pending;
    } catch {
      return; // never opened; nothing to close
    }
    try {
      await device.apps.close();
    } catch {
      // Closing an already-broken gateway is best-effort.
    }
  }
}

/**
 * One allocation's hold on one simulator (spec 015): the seam's lease over
 * the pool's claim. Binds the driver's per-udid verbs to this device, and
 * owns the two iOS-shaped choreographies the core must not know — the
 * allocation unwind and the wipe.
 */
class IosSimulatorLease implements DeviceLease {
  readonly id: string;
  readonly info: DeviceLeaseInfo;
  private readonly _driver: IosSimulatorDriver;
  private readonly _pool: DevicePool;
  private readonly _allocationId: string;
  /** This allocation created the simulator; its unwind must delete it (spec 002). */
  private readonly _created: boolean;
  /** This lease's own boot brought the device up; its unwind must shut it down. */
  private _bootedByUs = false;
  private _device: IosSimulatorDevice | undefined;
  /**
   * An erase running on this device right now — the one child no caller can
   * kill, settled-never-throwing so waiting on it is always safe.
   */
  private _erasing: Promise<void> | undefined;

  constructor({ driver, pool, result }: LeaseInit) {
    this._driver = driver;
    this._pool = pool;
    this._allocationId = result.allocationId;
    this._created = result.created;
    this.id = result.udid;
    this.info = {
      device: { udid: result.udid },
      name: result.device.name,
      os: result.device.os?.name ?? 'iOS',
    };
  }

  /** The device's app gateway — the object of its last boot. */
  get apps(): AppGateway {
    if (!this._device) throw new Error(`simulator ${this.id} has no device object: it was never booted by this lease`);
    return this._device.apps;
  }

  /** The boot inside allocation (spec 002: allocation always boots). */
  async initialBoot({ signal, onBootStart }: DriverBootArgs): Promise<void> {
    // Noted the moment a real boot begins, not when it returns: a boot whose
    // gateway then fails to open still leaves a simulator this lease brought
    // up, and the unwind must shut it down.
    let didBoot: boolean;
    try {
      didBoot = await this._driver.boot({
        udid: this.id,
        signal,
        onBootStart: () => {
          this._bootedByUs = true;
          onBootStart?.();
        },
      });
    } catch (err) {
      // A deadline-killed boot leaves the device unknown-state: fenced off, like a killed wipe.
      throw this._noteUnknownState(err);
    }
    this._bootedByUs ||= didBoot;
    this._pool.noteState(this.id, 'Booted');
    this._device = await this._driver.device(this.id);
  }

  release(): void {
    this._pool.release(this.id, this._allocationId);
  }

  async discard(): Promise<void> {
    const udid = this.id;
    if (!this._pool.isHeldBy(udid, this._allocationId)) {
      this._driver.log.debug(`allocation unwind skipped, ${udid} moved on`, { udid });
      return;
    }
    this._driver.log.debug(`unwinding allocation of ${udid}${this._created ? ' (created)' : ''}`, { udid });
    let shutdownFailure: Error | undefined;
    if (this._bootedByUs || this._created) {
      try {
        await this._driver.shutdown({ udid });
        this._pool.noteState(udid, 'Shutdown');
      } catch (err) {
        shutdownFailure = err instanceof Error ? err : new Error(String(err));
        this._driver.log.error(`compensating shutdown failed for ${udid}: ${shutdownFailure.message}`, { udid });
      }
    }
    if (this._created) {
      this._pool.discardCreated(udid, this._allocationId);
    } else {
      this._pool.release(udid, this._allocationId);
    }
    if (shutdownFailure) throw shutdownFailure;
  }

  onStateChange(listener: (state: DeviceRuntimeState) => void): void {
    this._pool.attachNotifier(this._allocationId, listener);
  }

  async boot({ signal, onBootStart }: DriverBootArgs = {}): Promise<boolean> {
    let didBoot: boolean;
    try {
      didBoot = await this._driver.boot({ udid: this.id, signal, onBootStart });
    } catch (err) {
      // A deadline-killed boot leaves the device unknown-state: fenced off, like a killed wipe.
      throw this._noteUnknownState(err);
    }
    this._device = await this._driver.device(this.id);
    this._pool.noteOperationalState(this._allocationId, 'booted');
    return didBoot;
  }

  async shutdown({ signal }: DriverSignalArgs = {}): Promise<boolean> {
    const didShutdown = await this._driver.shutdown({ udid: this.id, signal });
    this._pool.noteOperationalState(this._allocationId, 'shutdown');
    return didShutdown;
  }

  /**
   * The full wipe, v20-shaped: shutdown → erase → boot, resolving to a live
   * device. The shutdown and the erase run under no caller signal (an
   * in-flight erase is never killed; an abort lands between steps), and a
   * step the server's own deadline had to kill leaves the device in an
   * unknown state.
   */
  async resetContentAndSettings({ signal, onBootStart, onProgress }: DriverWipeArgs = {}): Promise<void> {
    const udid = this.id;
    this._throwIfAborted(signal);

    onProgress?.(`Shutting down ${udid}`);
    let didShutdown: boolean;
    try {
      // @issue DTX-6019: no caller signal — the abort waits until between steps.
      didShutdown = await this._driver.shutdown({ udid });
    } catch (err) {
      throw this._noteUnknownState(
        unknownStateIfKilled(err, { udid, command: 'simctl shutdown', timeoutMs: TEARDOWN_TIMEOUT_MS }),
      );
    }
    if (!didShutdown) onProgress?.(`${udid} was already shut down`);
    this._pool.noteOperationalState(this._allocationId, 'shutdown');

    this._throwIfAborted(signal);
    onProgress?.(`Erasing ${udid}`);
    const erasing = (async () => {
      try {
        // @issue DTX-6017: no signal — this child runs to completion or to the server's own deadline.
        await this._driver.erase({ udid });
      } catch (err) {
        throw this._noteUnknownState(err);
      }
    })();
    this._erasing = erasing.then(
      () => undefined,
      () => undefined,
    );
    try {
      await erasing;
    } finally {
      this._erasing = undefined;
    }

    if (signal?.aborted) {
      this._driver.log.info(`resetContentAndSettings cancelled after erase; leaving ${udid} cold`, { udid });
      throw new AbortError(signal.reason);
    }
    await this.boot({ signal, onBootStart });
  }

  launch(args: DriverLaunchArgs): Promise<DriverLaunchResult> {
    return this._driver.launch({ udid: this.id, ...args });
  }

  /**
   * The device is fenced off from picks and eviction for the duration
   * (`simctl terminate` can run up to a minute), and a lease whose device has
   * since moved to another owner touches nothing — that process is theirs.
   * An in-flight erase is waited out first.
   */
  async terminate({ bundleId, signal, tolerateDownDevice }: DriverTerminateArgs): Promise<void> {
    const udid = this.id;
    const unfence = this._pool.fenceForCleanup(udid, this._allocationId);
    if (!unfence) {
      this._driver.log.info(`terminate of ${bundleId} skipped: ${udid} moved to another allocation`, { udid, bundleId });
      return;
    }
    try {
      if (this._erasing) await this._erasing;
      await this._driver.terminate({ udid, bundleId, signal, tolerateDownDevice });
    } finally {
      unfence();
    }
  }

  resume(args: DriverBundleArgs): Promise<void> {
    return this._driver.resume({ udid: this.id, ...args });
  }

  install(args: DriverInstallArgs): Promise<void> {
    return this._driver.install({ udid: this.id, ...args });
  }

  uninstall(args: DriverBundleArgs): Promise<void> {
    return this._driver.uninstall({ udid: this.id, ...args });
  }

  openUrl(args: DriverOpenUrlArgs): Promise<void> {
    return this._driver.openUrl({ udid: this.id, ...args });
  }

  setLocation(args: DriverSetLocationArgs): Promise<void> {
    return this._driver.setLocation({ udid: this.id, ...args });
  }

  setStatusBar(args: DriverStatusBarArgs): Promise<void> {
    return this._driver.setStatusBar({ udid: this.id, ...args });
  }

  resetStatusBar(args: DriverSignalArgs = {}): Promise<void> {
    return this._driver.resetStatusBar({ udid: this.id, ...args });
  }

  setBiometricEnrollment(args: DriverBiometricEnrollmentArgs): Promise<void> {
    return this._driver.setBiometricEnrollment({ udid: this.id, ...args });
  }

  matchBiometric(args: DriverBiometricMatchArgs): Promise<void> {
    return this._driver.matchBiometric({ udid: this.id, ...args });
  }

  clearKeychain(args: DriverSignalArgs = {}): Promise<void> {
    return this._driver.clearKeychain({ udid: this.id, ...args });
  }

  sendToHome(args: DriverSignalArgs = {}): Promise<void> {
    return this._driver.sendToHome({ udid: this.id, ...args });
  }

  setPermissions(args: DriverPermissionsArgs): Promise<void> {
    return this._driver.setPermissions({ udid: this.id, ...args });
  }

  /**
   * @issue DTX-6020: the allocation ends here and the udid is fenced off.
   * The pool drops the claim (the core drops its record on the same error code).
   */
  private _noteUnknownState(err: unknown): Error {
    if (err instanceof DetoxError && err.code === DetoxErrorCode.DETOX_DEVICE_UNKNOWN_STATE) {
      this._pool.markUnknown(this.id, this._allocationId, err.message);
    }
    return err instanceof Error ? err : new Error(String(err));
  }

  /** @issue DTX-6018: the server's own abort rejection — never the caller's raw reason object. */
  private _throwIfAborted(signal?: AbortSignal): void {
    if (signal?.aborted) throw new AbortError(signal.reason);
  }
}
