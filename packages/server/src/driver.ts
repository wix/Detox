/**
 * The driver seam (spec 015): what the core asks of a platform, and no more.
 * `ios.simulator` is built in (`IosSimulatorDriver.ts`); any other
 * `device.type` is an npm package the server imports on first use
 * (`drivers.ts`), whose `createDriver` returns one of these.
 *
 * The core owns allocation ids, handle ids, ownership checks, the request
 * ledger and the typed refusal of an absent verb. Everything about the
 * platform is the driver's: how a device is found, pooled, booted and kept
 * warm, what its id and state vocabulary are, what its descriptor on the
 * wire looks like, and how a wipe is choreographed. The core never lists
 * devices, never compares a state string, and never names an id field —
 * it asks for a device and gets a lease.
 */
import type { AbortError, DetoxError, DetoxErrorCode } from '@detox-remote/core';
import type { DeviceRuntimeState } from '@detox-remote/protocol';

import type { AppGateway, AppGatewayOptions } from './AppGateway';
import type { AppOutputSink } from './app-output';
import type { ExecOpts, ExecResult } from './exec';

/** The one export a driver package must have: `createDriver(toolkit)`. */
export interface DriverModule {
  createDriver(toolkit: DriverToolkit): DeviceDriver | Promise<DeviceDriver>;
}

/**
 * What the server hands a driver package's `createDriver` — everything the
 * built-in iOS driver itself runs on, so a plain CommonJS package needs no
 * import of the server bundle: the gateway library (the frozen dialect), the
 * child-process runner (spawns narrated into the request's trace, spec 013),
 * the typed errors the wire understands (a refusal is `new DetoxError(message,
 * { code, details })` — anything else reaches the client as `DETOX_INTERNAL`),
 * the server's own log, and the server's `--max-pool` — what that number
 * bounds is the driver's call (the built-in pool: devices held plus kept warm).
 */
export interface DriverToolkit {
  appGateway: {
    listen(options?: AppGatewayOptions): Promise<AppGateway>;
  };
  exec: (opts: ExecOpts) => Promise<ExecResult>;
  errors: {
    DetoxError: typeof DetoxError;
    DetoxErrorCode: typeof DetoxErrorCode;
    AbortError: typeof AbortError;
  };
  log: DriverLog;
  maxPool: number;
}

/** The server's log as a driver sees it: a message and optional structured fields, at four levels. */
export interface DriverLog {
  error(message: string, fields?: Record<string, unknown>): void;
  warn(message: string, fields?: Record<string, unknown>): void;
  info(message: string, fields?: Record<string, unknown>): void;
  debug(message: string, fields?: Record<string, unknown>): void;
}

export interface DeviceDriver {
  /**
   * Hands out a booted device matching the wire's query, or refuses typed:
   * `DETOX_POOL_EXHAUSTED` when every match is held, `DETOX_NO_MATCHING_DEVICE`
   * when nothing matches, `DETOX_INVALID_ARGUMENT` for a query the driver
   * cannot read. A caller that aborts mid-way gets nothing and leaves nothing
   * behind — the driver unwinds its own half-done work before rejecting.
   */
  allocate(args: DriverAllocateArgs): Promise<DeviceLease>;
  /** Background work the driver runs for the server's lifetime (a reconcile loop) — optional. */
  start?(): void;
  stop?(): void;
  /** The server is closing: every device object (listeners, sockets) goes. */
  close(): Promise<void>;
}

export interface DriverAllocateArgs {
  /** The core's allocation id: the driver's ledger records the holder under it (spec 004 names holders by it). */
  allocationId: string;
  /** The wire's `device` query, verbatim — the driver's own vocabulary, validated by the driver. */
  device: unknown;
  /** The wire's `type` — for error payloads only. */
  requestedType: string;
  signal?: AbortSignal;
  /** Fires when a real boot is about to run — never on a warm device (spec 002 test 4); the core narrates a `boot` child. */
  onBootStart?: () => void;
}

/** Verbatim onto the allocation response: the wire descriptor, the display name, the OS. */
export interface DeviceLeaseInfo {
  /** The device's descriptor as the driver's own client types describe it (`{udid}` on iOS) — opaque to the core. */
  device: unknown;
  /** Human-readable device name, e.g. `iPhone 17`. */
  name: string;
  /** Human-readable OS, e.g. `iOS 26.5`. */
  os: string;
}

/**
 * One allocation's hold on one device: the device object (its app gateway)
 * and every verb the core may ask of it. The lease is per allocation, so
 * the driver can tell a compensation on a stale lease from one on a live one.
 */
export interface DeviceLease {
  /** The driver's own device key — log lines only; the core never parses it. */
  readonly id: string;
  readonly info: DeviceLeaseInfo;
  /** The device's app gateway: alive with the booted device, closed by nothing here. */
  readonly apps: AppGateway;
  /**
   * Hands the device back — a ledger entry: the app a previous
   * test left running is there for the next owner. Idempotent; a no-op once
   * the device moved on.
   */
  release(): void;
  /**
   * Unwinds an allocation nobody will ever hear about (a cancelled request):
   * the driver's own compensation — the built-in shuts down a device it
   * booted for this lease, deletes one it created. Idempotent; a no-op once
   * the device moved on. Rejects when the compensation itself failed, after
   * the claim is dropped regardless.
   */
  discard(): Promise<void>;
  /**
   * The push channel: the driver reports the device's state as it notices
   * it — its own transitions and out-of-band ones. The core forwards to the
   * owning connection. One listener per lease.
   */
  onStateChange(listener: (state: DeviceRuntimeState) => void): void;

  // ── Explicit cycling (spec 001/002) — optional, absent → DETOX_NOT_IMPLEMENTED ──
  /** Resolves `true` when a real boot ran, `false` when the device was already up. */
  boot?(args: DriverBootArgs): Promise<boolean>;
  shutdown?(args: DriverSignalArgs): Promise<boolean>;
  /**
   * The full wipe (spec 005): the platform's own choreography,
   * resolving to a live device. A step the server's deadline had to kill
   * leaves the device in an unknown state: the driver takes it
   * out of circulation — this lease's claim is void from here on, dropped by
   * the driver itself — and rejects `DETOX_DEVICE_UNKNOWN_STATE`; the core
   * forgets the allocation on that code without calling `release`.
   */
  resetContentAndSettings?(args: DriverWipeArgs): Promise<void>;

  /** The session id a launch of `bundleId` logs in with (the bundle id by default). */
  composeSessionId?(bundleId: string): string;

  // ── Device verbs — every one optional (absent → DETOX_NOT_IMPLEMENTED after ownership) ──
  launch?(args: DriverLaunchArgs): Promise<DriverLaunchResult>;
  /**
   * Kills the app's process. Also the launch rollback's compensation
   * (`tolerateDownDevice`): on a lease whose device has since moved to
   * another owner the driver must skip it — that process is somebody else's.
   */
  terminate?(args: DriverTerminateArgs): Promise<void>;
  /** A resume, never a launch: the connected app is brought to the front. */
  resume?(args: DriverBundleArgs): Promise<void>;
  install?(args: DriverInstallArgs): Promise<void>;
  uninstall?(args: DriverBundleArgs): Promise<void>;
  openUrl?(args: DriverOpenUrlArgs): Promise<void>;
  setLocation?(args: DriverSetLocationArgs): Promise<void>;
  setStatusBar?(args: DriverStatusBarArgs): Promise<void>;
  resetStatusBar?(args: DriverSignalArgs): Promise<void>;
  setBiometricEnrollment?(args: DriverBiometricEnrollmentArgs): Promise<void>;
  matchBiometric?(args: DriverBiometricMatchArgs): Promise<void>;
  clearKeychain?(args: DriverSignalArgs): Promise<void>;
  sendToHome?(args: DriverSignalArgs): Promise<void>;
  setPermissions?(args: DriverPermissionsArgs): Promise<void>;
}

/** A bare optional signal — what most single-device verbs take. */
export interface DriverSignalArgs {
  signal?: AbortSignal;
}

export interface DriverBootArgs extends DriverSignalArgs {
  /** Fires after the idempotence check decided a real boot is about to run — never on a warm device. */
  onBootStart?: () => void;
}

export interface DriverWipeArgs extends DriverBootArgs {
  /** A line of narration for the caller's progress channel (`Erasing …`). */
  onProgress?: (message: string) => void;
}

/** The app's own stdout/stderr (spec 013): where lines go and how many bytes are kept. */
export interface DriverLaunchOutput {
  sink: AppOutputSink;
  budgetBytes: number;
}

export interface DriverLaunchArgs extends DriverSignalArgs {
  bundleId: string;
  /** The session id the app must log in with — composed by the driver, registered by the core. */
  sessionId: string;
  /** This device's own gateway address, for the frozen argv convention. */
  serverUrl: string;
  /**
   * Called by a `launch` that spawns a process, after any terminate-first
   * and immediately before the spawn. The core arms its login claim here:
   * tombstoning the live session and claiming the next login any earlier
   * lets the OLD process's redial (the frozen native redials ~1 s after a
   * close) take the claim before the new one exists. A `launch` that never
   * signals a spawn gets the claim armed when it returns.
   */
  onSpawn?: () => void;
  launchArgs?: Record<string, string | number | boolean>;
  languageAndLocale?: { language?: string; locale?: string };
  /** The at-launch payload argv the core materialized (`detoxURLOverride`, file paths). */
  payloadArgs?: Record<string, string>;
  output?: DriverLaunchOutput;
}

export interface DriverLaunchResult {
  pid: number;
  /** Stops the output tail (spec 013) — the core calls it on session death or rollback. */
  stopOutput?: () => void;
}

export interface DriverTerminateArgs extends DriverSignalArgs {
  bundleId: string;
  /** A rollback's terminate: a device that is down is not an error. */
  tolerateDownDevice?: boolean;
}

export interface DriverBundleArgs extends DriverSignalArgs {
  bundleId: string;
}

export interface DriverInstallArgs extends DriverSignalArgs {
  appPath: string;
}

export interface DriverOpenUrlArgs extends DriverSignalArgs {
  url: string;
}

export interface DriverSetLocationArgs extends DriverSignalArgs {
  lat: number;
  lon: number;
}

export interface DriverStatusBarArgs extends DriverSignalArgs {
  overrides: Record<string, string | number | undefined>;
}

export interface DriverBiometricEnrollmentArgs extends DriverSignalArgs {
  enabled: boolean;
}

export interface DriverBiometricMatchArgs extends DriverSignalArgs {
  kind: 'face' | 'finger';
  matched: boolean;
}

export interface DriverPermissionsArgs extends DriverBundleArgs {
  permissions: Record<string, string>;
}
