// Device actions - direct device control (simctl, adb, etc.)

/**
 * Every device action names the allocation it acts on — the registry is the
 * only address book (spec 002 ownership rules). A udid is not accepted
 * here: udids outlive allocations, so a stale request would land on the
 * device's next owner; an allocationId can only ever name your own.
 */
export interface DeviceActionParams {
  allocationId: string;
}

// App management (device tells OS to install/launch/terminate apps)

/**
 * Content address of a build already pushed through the blob lane (spec
 * 007): the client archives the `.app` bundle, uploads the bytes once over
 * `PUT /v1/blobs/sha256/<hex>`, and installs by hash.
 */
export interface InstallAppBlob {
  /**
   * @issue DTX-2015: digest algorithm. Only `sha256` exists today; the
   * field exists so a second algorithm is a value on the wire, never a new
   * route.
   */
  algo: string;
  /** Lowercase hex sha-256 of the archived (zipped) `.app` bundle. */
  hex: string;
}

export interface InstallAppParams extends DeviceActionParams {
  /**
   * @issue DTX-6032: `appPath` and `blob` are mutually exclusive; a non-URL
   * `appPath` is a version-skew refusal, never a filesystem read.
   *
   * `appPath` is the URL form: an http(s) URL naming an app archive the
   * server fetches and unpacks (spec 003). `isHttpUrl` is the one predicate
   * both sides use to tell a URL from a stray path.
   */
  appPath?: string;
  /** The blob form: install bytes the client pushed through the lane. */
  blob?: InstallAppBlob;
}

/**
 * Whether an `installApp` string is the URL form rather than a path. Lives
 * next to `InstallAppParams` because it is part of that param's meaning:
 * client (skip path resolution) and server (skip the loopback gate) must
 * split on the same predicate or a string could change species in transit.
 */
export function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

export interface UninstallAppParams extends DeviceActionParams {
  appId?: string;
}

/**
 * `launchApp` takes only what physically becomes the app's argv (spec 006):
 * launch args, language/locale, and at-launch payloads.
 *
 * @issue DTX-6021: payload values materialize to the server's own file — a
 * client path never crosses the wire (relay-safe by shape).
 * @issue DTX-2012: the earlier draft's `newInstance` / `permissions` /
 * `delete` fields are gone; the server refuses params still carrying them
 * with a version-skew `DETOX_INVALID_ARGUMENT` (no
 * silently-dropped wire fields).
 *
 * Permissions moved to their own verb ({@link SetPermissionsParams});
 * resume is the app handle's `foreground`
 * ({@link import('./app').ForegroundAppParams}).
 */
export interface LaunchAppParams extends DeviceActionParams {
  appId?: string;
  launchArgs?: Record<string, string | number | boolean>;
  languageAndLocale?: {
    language?: string;
    locale?: string;
  };
  /**
   * The at-launch open-URL payload (v20 argv spelling `-detoxURLOverride` /
   * `-detoxSourceAppOverride`). Mutually exclusive with the other two payload
   * fields — presence-based, server-validated.
   */
  url?: string;
  sourceApp?: string;
  /** At-launch payloads as JSON values (spec 006) — never a path. */
  userNotification?: unknown;
  userActivity?: unknown;
  /**
   * Caller-owned ready timeout over the whole verb (accepting the request →
   * the app's own `ready`), in ms. Absent → the server default; `0` is
   * legal and means no server-side timeout — the caller's signal is the
   * only exit.
   */
  readyTimeoutMs?: number;
}

/**
 * `device.setPermissions` (spec 006): its own verb, never a launch option —
 * the applesimutils-backed services restart SpringBoard, and that blast
 * radius is device-wide. `permissions` maps service → value
 * (v20 vocabulary: `camera: 'YES'`, `location: 'inuse'`, …).
 *
 * @issue DTX-2013: unknown services and unknown values are typed refusals,
 * closing v20's two silent holes.
 */
export interface SetPermissionsParams extends DeviceActionParams {
  /** TCC rows are keyed by bundle id — no install precondition. */
  appId?: string;
  permissions?: Record<string, string>;
}

export interface LaunchAppResult {
  /** Real OS pid of the launched process — externally verifiable. */
  pid: number;
  /**
   * Server-minted per-launch app id (spec 003): the address every app action
   * carries alongside `allocationId`. Opaque — the server alone composes it,
   * so instance identity can later absorb reconnects without a client
   * contract change.
   */
  appHandleId: string;
}

export interface TerminateAppParams extends DeviceActionParams {
  appId?: string;
  /**
   * @issue DTX-2014: when present, terminate this launched instance — kill
   * the OS process, actively close its gateway session, and invalidate
   * that handle (spec 003 — "closed" is the pin, never who closed first).
   * Absent on the legacy Detox-20 path, which knows only bundle ids.
   */
  appHandleId?: string;
}

// Device actions (simctl/adb)

export type SendToHomeParams = DeviceActionParams;

export interface OpenURLParams extends DeviceActionParams {
  url: string;
  sourceApp?: string;
}

export interface SetLocationParams extends DeviceActionParams {
  lat: number;
  lon: number;
}

export type ResetContentAndSettingsParams = DeviceActionParams;

export type ClearKeychainParams = DeviceActionParams;

export interface TakeScreenshotParams extends DeviceActionParams {
  name?: string;
}

export interface TakeScreenshotResult {
  data: string; // base64 encoded
  mimeType?: string;
}

export interface ReverseTcpPortParams extends DeviceActionParams {
  port: number;
}

export interface UnreverseTcpPortParams extends DeviceActionParams {
  port: number;
}
