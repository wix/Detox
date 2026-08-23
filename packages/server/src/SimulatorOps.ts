import { execWithRetries, type ExecResult } from './exec';
import { DetoxError, DetoxErrorCode, DeviceUnknownStateError } from '@detox-remote/core';

import { resolveIosFrameworkPath } from './framework-cache';
import type { DeviceInfo } from '@detox-remote/protocol';

export interface ListArgs {
  query: Record<string, string>;
  signal?: AbortSignal;
}

export interface BootArgs {
  udid: string;
  bootArgs?: readonly string[];
  headless?: boolean;
  signal?: AbortSignal;
  /**
   * Fires after the idempotence check decided a real boot is about to run —
   * never on a warm device. The narration seam: a boot child operation must
   * exist exactly when a boot exists (spec 002 test 4 forbids narrating a
   * boot that never happened).
   */
  onBootStart?: () => void;
}

export interface LanguageAndLocale {
  language?: string;
  locale?: string;
}

/**
 * The Detox leg of a launch (spec 003): the frozen NSUserDefaults argv
 * convention plus dylib injection. `serverUrl`/`sessionId` become
 * `-detoxServer`/`-detoxSessionId` on the app's own argv — the URL must be
 * dialable verbatim, since the frozen native side can attach no headers.
 * `frameworkPath` is injected via `SIMCTL_CHILD_DYLD_INSERT_LIBRARIES` (v20
 * parity): Detox iOS apps never link the framework, and an instrumented
 * launch without it is the silent ready-handshake hang — the caller
 * resolves it up front through {@link SimulatorOps.resolveFrameworkPath} so
 * the typed refusal lands before any launch side effect (`framework-cache.ts`
 * carries the story).
 */
export interface DetoxLaunchArgs {
  serverUrl: string;
  sessionId: string;
  frameworkPath: string;
}

export interface LaunchAppArgs {
  udid: string;
  bundleId: string;
  launchArgs?: Record<string, string | number | boolean>;
  languageAndLocale?: LanguageAndLocale;
  /**
   * At-launch payload argv (spec 006): the v20 spellings (`detoxURLOverride`,
   * `detoxSourceAppOverride`, `detoxUserNotificationDataURL`,
   * `detoxUserActivityDataURL`) mapped to their values — file paths already
   * server-local (the handler materialized the wire value itself; a client
   * path never crosses the wire). Keys arrive without the `-` prefix,
   * like `launchArgs`.
   */
  payloadArgs?: Readonly<Record<string, string>>;
  detox?: DetoxLaunchArgs;
  signal?: AbortSignal;
}

/** `foreground()`'s resume (spec 006): the target instance, nothing else. */
export interface ResumeAppArgs {
  udid: string;
  bundleId: string;
  signal?: AbortSignal;
}

export interface SetAppPermissionsArgs {
  udid: string;
  bundleId: string;
  /** v20 vocabulary: service → value (`camera: 'YES'`, `location: 'inuse'`, …). */
  permissions: Readonly<Record<string, string>>;
  signal?: AbortSignal;
}

/** The `{udid, signal}` pair every single-device operation takes. */
export interface DeviceTargetArgs {
  udid: string;
  signal?: AbortSignal;
}

interface ExecSimctlArgs {
  args: readonly string[];
  signal?: AbortSignal;
  retries?: number;
  timeout?: number;
  /** Extra child environment (`SIMCTL_CHILD_*` injection — spec 003). */
  env?: Readonly<Record<string, string>>;
}

interface ExecApplesimutilsArgs {
  args: readonly string[];
  signal?: AbortSignal;
}

/** The slice of an exec error we actually inspect. */
interface ExecErrorLike {
  stderr?: string;
}

interface MergeLaunchArgsInput {
  launchArgs: Record<string, string | number | boolean>;
  languageAndLocale?: LanguageAndLocale;
}

export interface TerminateAppArgs {
  udid: string;
  bundleId: string;
  signal?: AbortSignal;
  /** @issue DTX-6109: tolerates "device not running" only for a compensation — a live caller still gets the error. */
  tolerateDownDevice?: boolean;
}

export interface UninstallAppArgs {
  udid: string;
  bundleId: string;
  signal?: AbortSignal;
}

export interface InstallAppArgs {
  udid: string;
  appPath: string;
  signal?: AbortSignal;
}

export interface OpenUrlArgs {
  udid: string;
  url: string;
  signal?: AbortSignal;
}

export interface SetLocationArgs {
  udid: string;
  lat: number;
  lon: number;
  signal?: AbortSignal;
}

/**
 * Status-bar overrides, one field per `simctl status_bar override` flag.
 * Ported from Detox 20's `AppleSimUtils.statusBarOverride`.
 * @issue DTX-6111: only present fields become argv; absent means leave that one alone.
 * @issue DTX-6110: `0` is treated as a value, not absence.
 */
export interface StatusBarOverrides {
  time?: string;
  dataNetwork?: string;
  wifiMode?: string;
  wifiBars?: number;
  cellularMode?: string;
  cellularBars?: number;
  operatorName?: string;
  batteryState?: string;
  batteryLevel?: number;
}

export interface SetStatusBarArgs {
  udid: string;
  overrides: StatusBarOverrides;
  signal?: AbortSignal;
}

export interface SetBiometricEnrollmentArgs {
  udid: string;
  enabled: boolean;
  signal?: AbortSignal;
}

/** Which sensor a biometric event speaks for, and whether it matched. */
export interface BiometricMatchArgs {
  udid: string;
  kind: 'face' | 'finger';
  matched: boolean;
  signal?: AbortSignal;
}

/**
 * @issue DTX-6112: takes no signal, so an in-flight erase can never be killed by a caller's cancellation.
 * The server's own deadline still bounds it (see {@link ERASE_TIMEOUT_MS}).
 */
export interface EraseArgs {
  udid: string;
}

export interface CreateDeviceArgs {
  name: string;
  deviceTypeIdentifier: string;
  runtimeIdentifier: string;
  signal?: AbortSignal;
}

/** One simulator as `simctl list devices` reports it — the rollback's view. */
export interface RawDeviceListing {
  udid: string;
  name: string;
  state: string;
}

export interface CreatableQueryArgs {
  /** Device-type name off the wire, e.g. `iPhone 16 Pro`. */
  model: string;
  /** Optional OS narrowing, e.g. `iOS 26.5` — matched against runtime name/version. */
  os?: string;
  signal?: AbortSignal;
}

export interface CreatableDeviceType {
  deviceTypeIdentifier: string;
  runtime: { identifier: string; name: string; version: string };
}

interface SimctlDeviceList {
  devices?: Record<string, Array<{ udid: string; name: string; state: string }>>;
}

interface SimctlRuntimeList {
  runtimes?: Array<{
    identifier: string;
    name: string;
    version: string;
    platform?: string;
    isAvailable?: boolean;
    supportedDeviceTypes?: Array<{ name: string; identifier: string }>;
  }>;
}

/** Numeric-aware `26.5` vs `18.0` comparison; returns >0 when `a` is newer. */
function compareVersions(a: string, b: string): number {
  const as = a.split('.').map(Number);
  const bs = b.split('.').map(Number);
  for (let i = 0; i < Math.max(as.length, bs.length); i++) {
    const diff = (as[i] ?? 0) - (bs[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/**
 * Ceiling on a device listing. Generous — enumerating every runtime on a cold
 * CoreSimulator is genuinely slow — but finite, because callers hold a lock.
 */
const LIST_TIMEOUT_MS = 60_000;

/**
 * Ceiling on `simctl shutdown`/`delete`. A wedged CoreSimulator otherwise
 * leaves a detached eviction or rollback pending forever, holding its device
 * out of the pool for the server's whole (always-on) life.
 *
 * Exported because the wipe's shutdown leg reports the number it was killed by
 * (the unknown-state error's payload names the deadline that ended the operation).
 */
export const TEARDOWN_TIMEOUT_MS = 60_000;

/**
 * Ceiling on the quick one-shot utilities (uninstall, location, keychain,
 * status bar, notifyutil). None of them does real work — they hand a message
 * to CoreSimulator — so anything past this is a wedged simulator, not a slow
 * one, and the caller must hear about it instead of hanging.
 * @issue DTX-6113: every verb here runs with `retries: 0`, never the inherited default of 1.
 */
const UTILITY_TIMEOUT_MS = 60_000;

/**
 * Ceiling on `simctl openurl`, per attempt. Separate from the rest because it
 * is the only utility whose completion depends on an app waking up (Safari, a
 * deep-link handler): a cold first open after boot can outlive simctl's own ack
 * while the URL still lands late.
 * @issue DTX-6114: the only utility that retries — see {@link SimulatorOps.openUrl}.
 */
const OPEN_URL_TIMEOUT_MS = 60_000;

/**
 * Ceiling on `simctl install`, per attempt. Its own constant rather than the
 * utility default so a slow CoreSimulator copying a large bundle is not
 * misread as a wedge; `retries: 0` like every one-shot verb — re-copying a
 * half-installed bundle on a timeout would double the wait for nothing.
 */
const INSTALL_TIMEOUT_MS = 120_000;

/**
 * Ceiling on `simctl launch`, per (single) attempt. This is a wedge
 * detector, not a patience limit: the child's death is
 * otherwise unobservable, and an unbounded child under the reclaim barrier
 * would hold `release` hostage for the server's lifetime. What it guards in
 * practice is the first launch on a freshly booted device — the one measured
 * case where a launch genuinely outlives a minute (a cold CoreSimulator
 * runtime warming up); shrinking it on "launch is fast" would break cold
 * boots. `retries: 0` is still load-bearing: a re-run of
 * `simctl launch` after a spawn error would silently resume the
 * half-launched instance, not retry the fresh launch the caller asked for.
 */
const LAUNCH_TIMEOUT_MS = 120_000;

/** Ceiling on `simctl terminate` — same reclaim-barrier reasoning, one-shot. */
const TERMINATE_TIMEOUT_MS = 60_000;

/**
 * Ceiling on `simctl erase`. The one deadline nobody can shorten: the
 * caller's signal never reaches this child (an erase is never killed by a
 * caller's cancellation), so this number alone decides how long a wipe may
 * hold a device hostage.
 * Erase of a fresh simulator is sub-second, so anything near this is a
 * wedged CoreSimulator.
 * @issue DTX-6116: a kill leaves the device unknown-state, reported by `unknownStateIfKilled`.
 */
const ERASE_TIMEOUT_MS = 60_000;

/**
 * Darwin notify keys the simulator's biometric stack listens on. These are
 * not ported from Detox 20: Detox 20 shells out to applesimutils
 * (`--biometricEnrollment`, `--matchFace`/`--biometricMatch`); the keys are
 * applesimutils' own internals, which we talk to directly.
 * @issue DTX-6117: addressed by udid, not `--booted`.
 * A wrong key is an undetectable no-op for the match events: a one-shot
 * notification has nothing to read back (enrollment, which is readable via
 * `notifyutil -g`, gates that gap instead — spec 005).
 */
const BIOMETRIC_ENROLLMENT_KEY = 'com.apple.BiometricKit.enrollmentChanged';
const BIOMETRIC_MATCH_KEYS = {
  face: { match: 'com.apple.BiometricKit_Sim.pearl.match', nomatch: 'com.apple.BiometricKit_Sim.pearl.nomatch' },
  finger: {
    match: 'com.apple.BiometricKit_Sim.fingerTouch.match',
    nomatch: 'com.apple.BiometricKit_Sim.fingerTouch.nomatch',
  },
} as const;

/**
 * Refuses a value that would land in argv looking like a flag.
 *
 * A leading `-` in a client-supplied value would become a simctl or
 * applesimutils option. Typed as DETOX_INVALID_ARGUMENT so it reads as the
 * caller's fault.
 */
function refuseFlagShaped(what: string, value: string): void {
  if (value.startsWith('-')) {
    throw new DetoxError(`Refusing a ${what} that looks like a command-line flag: ${value}`, {
      code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
      details: { parameter: what, value },
    });
  }
}

/** One resolved permission write: which backend, and its exact vocabulary. */
type PermissionCommand =
  | { backend: 'simctl'; action: 'grant' | 'revoke' | 'reset'; service: string }
  | { backend: 'applesimutils'; service: string; value: string };

/** The YES/NO/unset triple every simctl-basic service speaks (v20's `basicPermissionValueToSimctlAction`). */
const SIMCTL_BASIC_ACTIONS: Record<string, 'grant' | 'revoke' | 'reset'> = {
  YES: 'grant',
  NO: 'revoke',
  unset: 'reset',
};

/** The seven TCC services `simctl privacy` speaks directly (v20's switch, kebab-cased where simctl demands it). */
const SIMCTL_BASIC_SERVICES: Record<string, string> = {
  calendar: 'calendar',
  camera: 'camera',
  medialibrary: 'media-library',
  microphone: 'microphone',
  motion: 'motion',
  reminders: 'reminders',
  siri: 'siri',
};

/** The six services only applesimutils can write (each write restarts SpringBoard). */
const APPLESIMUTILS_SERVICES = new Set([
  'notifications',
  'health',
  'homekit',
  'speech',
  'faceid',
  'userTracking',
]);

const invalidPermission = (message: string, details: Record<string, unknown>): DetoxError =>
  new DetoxError(message, { code: DetoxErrorCode.DETOX_INVALID_ARGUMENT, details });

/**
 * Resolves one `service: value` pair to its backend command, or refuses it
 * typed. This is the dispatch table spec 006's integration gate pins argv-
 * by-argv; v20's silent holes (switch fall-through on an unknown service, an
 * `undefined` action on an unknown value) both land here as 2011.
 */
function permissionCommand(service: string, value: string): PermissionCommand {
  // @issue DTX-6119: Object.hasOwn only — wire keys/values must never resolve through the prototype chain.
  if (service === 'location') {
    switch (value) {
      case 'always':
        return { backend: 'simctl', action: 'grant', service: 'location-always' };
      case 'inuse':
        return { backend: 'simctl', action: 'grant', service: 'location' };
      case 'never':
        return { backend: 'simctl', action: 'revoke', service: 'location' };
      case 'unset':
        return { backend: 'simctl', action: 'reset', service: 'location' };
      default:
        return unknownPermissionValue(service, value, ['always', 'inuse', 'never', 'unset']);
    }
  }
  if (service === 'contacts' || service === 'photos') {
    if (value === 'limited') {
      return {
        backend: 'simctl',
        action: 'grant',
        service: service === 'contacts' ? 'contacts-limited' : 'photos-add',
      };
    }
    if (Object.hasOwn(SIMCTL_BASIC_ACTIONS, value)) return { backend: 'applesimutils', service, value };
    return unknownPermissionValue(service, value, ['YES', 'NO', 'unset', 'limited']);
  }
  if (Object.hasOwn(SIMCTL_BASIC_SERVICES, service)) {
    if (!Object.hasOwn(SIMCTL_BASIC_ACTIONS, value)) {
      return unknownPermissionValue(service, value, Object.keys(SIMCTL_BASIC_ACTIONS));
    }
    return { backend: 'simctl', action: SIMCTL_BASIC_ACTIONS[value], service: SIMCTL_BASIC_SERVICES[service] };
  }
  if (APPLESIMUTILS_SERVICES.has(service)) {
    if (Object.hasOwn(SIMCTL_BASIC_ACTIONS, value)) return { backend: 'applesimutils', service, value };
    return unknownPermissionValue(service, value, Object.keys(SIMCTL_BASIC_ACTIONS));
  }
  throw invalidPermission(
    `setPermissions does not know the service "${service}" — v20's silent switch fall-through is a typed refusal here`,
    { method: 'setPermissions', service },
  );
}

function unknownPermissionValue(service: string, value: string, known: readonly string[]): never {
  throw invalidPermission(
    `setPermissions does not know the value "${value}" for "${service}" (expected one of ${known.join(', ')}) ` +
      "— v20 would have composed `simctl privacy … undefined` here",
    { method: 'setPermissions', service, value },
  );
}

/**
 * The exec error fields that tell a deadline kill from an ordinary failure.
 *
 * Duck-typed: `child_process` sets `killed: true` on the error it rejects
 * with when its own `timeout` fires, but exposes no class to test against —
 * the flag is the only signal, and a Node that stopped setting it would
 * silently downgrade every wedge to an ordinary failure.
 */
interface KilledExecError {
  killed?: boolean;
}

/** Names the operation a deadline kill happened in — the error's payload. */
export interface KilledOperation {
  udid: string;
  /** What was running, for the message: `simctl erase`, `simctl shutdown`, … */
  command: string;
  timeoutMs: number;
}

/**
 * @issue DTX-6116: the one place a killed child becomes an unknown-state error (erase, shutdown today).
 * @issue DTX-6120: anything else keeps its own identity and is rethrown untouched.
 */
export function unknownStateIfKilled(err: unknown, { udid, command, timeoutMs }: KilledOperation): Error {
  if ((err as KilledExecError).killed !== true) {
    // @issue DTX-6120: identity preserved — rethrows exactly what simctl produced.
    return err instanceof Error ? err : new Error(String(err));
  }
  return new DeviceUnknownStateError(
    `${command} on ${udid} was killed after ${String(timeoutMs)}ms — the device's state is unknown`,
    { details: { udid, command, timeoutMs }, cause: err },
  );
}

export class SimulatorOps {
  async list({ query, signal }: ListArgs): Promise<DeviceInfo[]> {
    // @issue DTX-6121: query values are refused if flag-shaped rather than trusted to applesimutils' own parser.
    const flags = Object.entries(query).flatMap(([k, v]) => {
      refuseFlagShaped(`device query value (${k})`, v);
      return [`--${k}`, v];
    });
    const result = await this._execApplesimutils({ args: ['--list', ...flags], signal });
    const raw = result.stdout || result.stderr || '[]';
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      // A SyntaxError here would otherwise escape as an opaque crash out of
      // whatever polled us; say what actually failed.
      throw new Error(
        `applesimutils --list did not return JSON: ${raw.slice(0, 200)}`,
        { cause: err },
      );
    }
    return Array.isArray(parsed) ? (parsed as DeviceInfo[]) : [];
  }

  async boot({ udid, bootArgs = [], headless = true, signal, onBootStart }: BootArgs): Promise<boolean> {
    const isBooted = await this._isBooted({ udid, signal });
    if (isBooted) return false;

    onBootStart?.();
    try {
      await this._execSimctl({ args: ['boot', udid, ...bootArgs], signal, retries: 10 });
      await this._execSimctl({ args: ['bootstatus', udid], signal });
    } catch (err) {
      // Killing `simctl boot`/`bootstatus` does not stop the simulator itself —
      // launchd_sim keeps going and simctl would still report it Booted. An
      // aborted boot must leave no running simulator behind, so compensate
      // (with no signal: this must run even though we were just aborted).
      if (signal?.aborted) {
        await this.shutdown({ udid }).catch(() => {});
      }
      throw err;
    }

    if (!headless) {
      await this._openSimulatorApp({ udid, signal });
    }

    return true;
  }

  /**
   * Idempotent, mirroring `boot`: shutting down an already-shut-down device
   * resolves instead of throwing. Ported from Detox 20
   * (detox/src/devices/common/drivers/ios/tools/AppleSimUtils.js `shutdown`),
   * with the idempotence check `boot` already uses here.
   */
  async shutdown({ udid, signal }: DeviceTargetArgs): Promise<boolean> {
    const isBooted = await this._isBooted({ udid, signal });
    if (!isBooted) return false;

    try {
      await this._execSimctl({ args: ['shutdown', udid], signal, timeout: TEARDOWN_TIMEOUT_MS });
    } catch (err: unknown) {
      // Lost the race against another shutdown — the state we wanted anyway.
      const stderr = (err as ExecErrorLike).stderr ?? '';
      if (stderr.includes('Unable to shutdown device in current state')) return false;
      throw err;
    }
    return true;
  }

  /**
   * Names the simulator after the model, with no marker suffix: the created
   * device is a normal member of the fleet (a completed creation is never
   * special-cased), and a name like `iPhone 16 Pro` is
   * what later `byType`/`byName` queries and humans expect to find. How a
   * future opt-in GC identifies registry-created simulators is not decided
   * here (spec 002).
   */
  async create({ name, deviceTypeIdentifier, runtimeIdentifier, signal }: CreateDeviceArgs): Promise<string> {
    const result = await this._execSimctl({
      args: ['create', name, deviceTypeIdentifier, runtimeIdentifier],
      signal,
    });
    return result.stdout.trim();
  }

  /** Deletes a simulator outright. Rollback of a cancelled/failed create only — no other caller may delete a device. */
  async deleteDevice({ udid, signal }: DeviceTargetArgs): Promise<void> {
    await this._execSimctl({ args: ['delete', udid], signal, timeout: TEARDOWN_TIMEOUT_MS });
  }

  /**
   * Every simulator CoreSimulator knows, straight from `simctl` — including
   * unavailable and mid-creation ones, which `applesimutils --list` may hide.
   * This is the rollback's ground truth for spotting half-made leftovers.
   */
  async rawDevices({ signal }: { signal?: AbortSignal } = {}): Promise<RawDeviceListing[]> {
    const result = await this._execSimctl({
      args: ['list', 'devices', '-j'],
      signal,
      timeout: LIST_TIMEOUT_MS,
    });
    const parsed = JSON.parse(result.stdout || '{"devices":{}}') as SimctlDeviceList;
    return Object.values(parsed.devices ?? {}).flatMap((devices) =>
      devices.map(({ udid, name, state }) => ({ udid, name, state })),
    );
  }

  /**
   * Whether a query that matches no existing simulator could be satisfied by
   * creating one: the model must be a device type some available iOS runtime
   * supports (spec 002 — a creatable query is a capacity question, never the
   * terminal `DETOX_NO_MATCHING_DEVICE`). Runtimes are consulted rather than
   * bare device types because `supportedDeviceTypes` already encodes the
   * min/max-runtime compatibility simctl would otherwise reject at create time.
   */
  async creatableDeviceType({ model, os, signal }: CreatableQueryArgs): Promise<CreatableDeviceType | undefined> {
    const result = await this._execSimctl({
      args: ['list', 'runtimes', '-j'],
      signal,
      timeout: LIST_TIMEOUT_MS,
    });
    const parsed = JSON.parse(result.stdout || '{"runtimes":[]}') as SimctlRuntimeList;
    const candidates = (parsed.runtimes ?? [])
      .filter((runtime) => runtime.isAvailable !== false)
      .filter((runtime) => (runtime.platform ?? runtime.name).startsWith('iOS'))
      .filter((runtime) => (os ? runtime.name === os || runtime.version === os : true))
      // Newest runtime first, so an unqualified query creates on the latest OS.
      .sort((a, b) => compareVersions(b.version, a.version));
    for (const runtime of candidates) {
      const deviceType = (runtime.supportedDeviceTypes ?? []).find((t) => t.name === model);
      if (deviceType) {
        return {
          deviceTypeIdentifier: deviceType.identifier,
          runtime: { identifier: runtime.identifier, name: runtime.name, version: runtime.version },
        };
      }
    }
    return undefined;
  }

  /**
   * Resolves the framework binary an instrumented launch will inject:
   * explicit override first (`DETOX_IOS_FRAMEWORK_PATH` via `ServerDeps`),
   * else the newest v20 framework-cache build, else a typed 2009 refusal
   * (`framework-cache.ts` carries the whole story). A method rather than a
   * free function so the launch handler resolves through the same seam its
   * unit tests stub — and it must run before any launch side effect, which
   * is why `launch` takes the resolved path instead of resolving itself.
   */
  async resolveFrameworkPath(explicit?: string): Promise<string> {
    return resolveIosFrameworkPath(explicit);
  }

  async launch({
    udid,
    bundleId,
    launchArgs = {},
    languageAndLocale,
    payloadArgs = {},
    detox,
    signal,
  }: LaunchAppArgs): Promise<number> {
    refuseFlagShaped('bundle id', bundleId);
    const merged = this._mergeLaunchArgs({ launchArgs, languageAndLocale });
    // @issue DTX-6108: payload argv after user args, before the frozen detox pair (NSUserDefaults reads the last occurrence).
    for (const [key, value] of Object.entries(payloadArgs)) {
      merged.push([`-${key}`, value]);
    }
    if (detox) {
      // @issue DTX-6108: the frozen argv convention is appended last, so no user launch arg can displace it.
      merged.push(['-detoxServer', detox.serverUrl], ['-detoxSessionId', detox.sessionId]);
    }
    // `simctl launch` has no `--args` flag: everything after the bundle id is
    // the app's argv. v20's shell command carries a literal `--args` token as
    // every app's first argument, which NSUserDefaults ignores; the `-key
    // value` pairs are the convention that matters, so the stray token is not
    // reproduced here.
    const result = await this._execSimctl({
      args: ['launch', udid, bundleId, ...merged.flat()],
      signal,
      retries: 0,
      timeout: LAUNCH_TIMEOUT_MS,
      // @issue DTX-6122: injection rides simctl's own child-environment convention.
      // The GUL guard is v20 parity: without it, Firebase's class-disposal
      // hack crashes injected apps at launch.
      env: detox
        ? {
            SIMCTL_CHILD_DYLD_INSERT_LIBRARIES: detox.frameworkPath,
            SIMCTL_CHILD_GULGeneratedClassDisposeDisabled: 'YES',
          }
        : undefined,
    });
    const pid = parseInt((result.stdout || ':').trim().split(':')[1], 10);
    // A pid we cannot read must fail here, typed: `NaN` flowing onward reads
    // as `pid: null` on the wire under a number-typed field, and the launch
    // cleanup's `pid > 0` guard would silently skip its compensation.
    if (!Number.isFinite(pid) || pid <= 0) {
      throw new DetoxError(`simctl launch output did not carry a pid: ${result.stdout.trim()}`, {
        code: DetoxErrorCode.DETOX_INTERNAL,
        details: { udid, bundleId },
      });
    }
    return pid;
  }

  /**
   * @issue DTX-6123: a resume performs no new launch transaction — bare argv, no detox pair, no injection env.
   * {@link LAUNCH_TIMEOUT_MS} is still the same wedge detector on a
   * child whose death is otherwise unobservable.
   */
  async resume({ udid, bundleId, signal }: ResumeAppArgs): Promise<void> {
    refuseFlagShaped('bundle id', bundleId);
    await this._execSimctl({
      args: ['launch', udid, bundleId],
      signal,
      retries: 0,
      timeout: LAUNCH_TIMEOUT_MS,
    });
  }

  /**
   * `device.setPermissions` (spec 006): per-service dispatch ported from
   * Detox 20's measured behaviour (`AppleSimUtils.js:33-137`), with its two
   * silent holes closed — an unknown service key and an unknown value for a
   * known service are typed refusals here (v20 falls through its switch, or
   * composes `simctl privacy <udid> undefined …`).
   *
   * Backends per service, v20-verbatim: `location` and the seven basic TCC
   * services ride `simctl privacy` (addressed by udid); `contacts`/`photos`
   * ride simctl only for `limited` (`contacts-limited` / `photos-add`) and
   * applesimutils otherwise; `notifications health homekit speech faceid
   * userTracking` always ride applesimutils, one invocation per service.
   *
   * Blast radius, documented on the verb: every
   * applesimutils-backed invocation carries `--restartSB` — SpringBoard
   * restarts, and every app on the device loses its foreground state;
   * sibling handles may observe their app backgrounded or killed. Callers
   * sequence `setPermissions` before launches, as v20 did.
   * @issue DTX-6124: every entry is validated before the first command runs — no half-applied batch.
   */
  async setPermissions({ udid, bundleId, permissions, signal }: SetAppPermissionsArgs): Promise<void> {
    refuseFlagShaped('app id', bundleId);
    const commands = Object.entries(permissions).map(([service, value]) =>
      permissionCommand(service, value),
    );
    for (const command of commands) {
      if (command.backend === 'simctl') {
        // `retries: 0` diverges from v20's `retries: 1`: the class-wide
        // utility rule (see UTILITY_TIMEOUT_MS) — a TCC write either lands
        // in seconds or the simulator is wedged, and waiting twice as long
        // buys nothing.
        await this._execSimctl({
          args: ['privacy', udid, command.action, command.service, bundleId],
          signal,
          retries: 0,
          timeout: UTILITY_TIMEOUT_MS,
        });
      } else {
        // @issue DTX-6125: one invocation per service — a retry would restart SpringBoard twice for nothing.
        await this._execApplesimutilsRequired({
          args: [
            '--byId',
            udid,
            '--bundle',
            bundleId,
            '--restartSB',
            '--setPermissions',
            `${command.service}=${command.value}`,
          ],
          signal,
        });
      }
    }
  }

  /**
   * Installs an app bundle from a path on this machine — since spec 007
   * always a server-local temp path the handler just unpacked (from a
   * fetched URL archive or a blob-store entry; the interim client-path
   * transport is dead). `simctl install` verifies the bundle, so a bogus
   * path or wrong-arch binary fails loudly here.
   */
  async install({ udid, appPath, signal }: InstallAppArgs): Promise<void> {
    refuseFlagShaped('app path', appPath);
    await this._execSimctl({
      args: ['install', udid, appPath],
      signal,
      retries: 0,
      timeout: INSTALL_TIMEOUT_MS,
    });
  }

  async terminate({
    udid,
    bundleId,
    signal,
    tolerateDownDevice,
  }: TerminateAppArgs): Promise<void> {
    refuseFlagShaped('bundle id', bundleId);
    try {
      await this._execSimctl({
        args: ['terminate', udid, bundleId],
        signal,
        retries: 0,
        timeout: TERMINATE_TIMEOUT_MS,
      });
    } catch (err: unknown) {
      const stderr = (err as ExecErrorLike).stderr ?? '';
      if (stderr.includes('not currently running') || stderr.includes('found nothing to terminate')) return;
      // simctl's wording for a device that is not booted (and for one erased
      // out from under us). Same meaning as the two above for a compensation:
      // nothing of ours is running there.
      if (
        tolerateDownDevice &&
        (stderr.includes('Unable to lookup in current state: Shutdown') ||
          stderr.includes('current state: Shutting Down') ||
          stderr.includes('Invalid device'))
      ) {
        return;
      }
      throw err;
    }
  }

  /**
   * "Ensure not installed" — idempotent by simctl's own semantics:
   * uninstalling an app that is not there exits 0. Ported from Detox 20
   * (`AppleSimUtils.uninstall`), minus its swallow-everything error
   * handling: a real failure must reach the caller typed, not be logged
   * and hidden.
   * @issue DTX-6113: `retries: 0`, explicitly — see {@link UTILITY_TIMEOUT_MS}.
   */
  async uninstall({ udid, bundleId, signal }: UninstallAppArgs): Promise<void> {
    refuseFlagShaped('app id', bundleId);
    await this._execSimctl({
      args: ['uninstall', udid, bundleId],
      signal,
      retries: 0,
      timeout: UTILITY_TIMEOUT_MS,
    });
  }

  /**
   * Hands the URL to the simulator and nothing else: the server never
   * dereferences it, never resolves it, never looks at its scheme (spec 005
   * — the same line `install` draws). Ported from Detox 20
   * (`AppleSimUtils.openUrl`, itself unreachable there).
   * @issue DTX-6114: the only utility that retries — a cold Safari's first open can outlive simctl's ack.
   */
  async openUrl({ udid, url, signal }: OpenUrlArgs): Promise<void> {
    refuseFlagShaped('URL', url);
    await this._execSimctl({
      args: ['openurl', udid, url],
      signal,
      retries: 1,
      timeout: OPEN_URL_TIMEOUT_MS,
    });
  }

  /** Ported from Detox 20 (`AppleSimUtils.setLocation`) — `lat,lon` is one argv slot. */
  async setLocation({ udid, lat, lon, signal }: SetLocationArgs): Promise<void> {
    await this._execSimctl({
      args: ['location', udid, 'set', `${String(lat)},${String(lon)}`],
      signal,
      retries: 0,
      timeout: UTILITY_TIMEOUT_MS,
    });
  }

  /**
   * Ported from Detox 20 (`AppleSimUtils.statusBarOverride`).
   * @issue DTX-6111: only fields the caller sent become flags.
   * @issue DTX-6110: `0` counts as sent.
   */
  async setStatusBar({ udid, overrides, signal }: SetStatusBarArgs): Promise<void> {
    const flags: string[] = [];
    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined) continue;
      const text = String(value);
      refuseFlagShaped(`status-bar ${key}`, text);
      flags.push(`--${key}`, text);
    }
    if (flags.length === 0) return;
    await this._execSimctl({
      args: ['status_bar', udid, 'override', ...flags],
      signal,
      retries: 0,
      timeout: UTILITY_TIMEOUT_MS,
    });
  }

  /** Ported from Detox 20 (`AppleSimUtils.statusBarReset`). */
  async resetStatusBar({ udid, signal }: DeviceTargetArgs): Promise<void> {
    await this._execSimctl({
      args: ['status_bar', udid, 'clear'],
      signal,
      retries: 0,
      timeout: UTILITY_TIMEOUT_MS,
    });
  }

  /** @issue DTX-6126: simctl grew a first-party keychain verb, dropping the applesimutils shell-out Detox 20 used. */
  async clearKeychain({ udid, signal }: DeviceTargetArgs): Promise<void> {
    await this._execSimctl({
      args: ['keychain', udid, 'reset'],
      signal,
      retries: 0,
      timeout: UTILITY_TIMEOUT_MS,
    });
  }

  /**
   * Biometric enrollment is a persistent Darwin notify state: set it, then
   * post it so anything listening re-reads. Detox 20 goes through
   * applesimutils (`--biometricEnrollment`), which on iOS 26+ addresses the
   * device as `--booted` — ambiguous once two simulators are up.
   * @issue DTX-6117: `simctl spawn <udid>` addresses the exact device instead.
   */
  async setBiometricEnrollment({ udid, enabled, signal }: SetBiometricEnrollmentArgs): Promise<void> {
    await this._execSimctl({
      args: [
        'spawn',
        udid,
        'notifyutil',
        '-s',
        BIOMETRIC_ENROLLMENT_KEY,
        enabled ? '1' : '0',
        '-p',
        BIOMETRIC_ENROLLMENT_KEY,
      ],
      signal,
      retries: 0,
      timeout: UTILITY_TIMEOUT_MS,
    });
  }

  /**
   * A match/no-match is a one-shot notification, not state — nothing to
   * read back afterwards. Same addressing argument as enrollment above;
   * Detox 20's `matchBiometric`/`unmatchBiometric` are the ported
   * behaviour (the notify keys are not — see {@link BIOMETRIC_ENROLLMENT_KEY}).
   * @issue DTX-6113: retries:0 is load-bearing — a retry would deliver a second, unwanted prompt answer.
   */
  async matchBiometric({ udid, kind, matched, signal }: BiometricMatchArgs): Promise<void> {
    const key = BIOMETRIC_MATCH_KEYS[kind][matched ? 'match' : 'nomatch'];
    await this._execSimctl({
      args: ['spawn', udid, 'notifyutil', '-p', key],
      signal,
      retries: 0,
      timeout: UTILITY_TIMEOUT_MS,
    });
  }

  /**
   * Wipes the device's content and settings. Ported from Detox 20
   * (`AppleSimUtils.resetContentAndSettings`); the shutdown/boot bracket
   * around it lives in the server (`SimulatorDriver.resetContentAndSettings`),
   * because `simctl erase` refuses a booted device (SimError 405) and the
   * caller must not be the one to know that.
   * @issue DTX-6112: takes no signal — the caller's cancellation must never kill this child.
   * @issue DTX-6116: only the server's own deadline can end it, leaving the device unknown-state.
   */
  async erase({ udid }: EraseArgs): Promise<void> {
    try {
      await this._execSimctl({ args: ['erase', udid], timeout: ERASE_TIMEOUT_MS, retries: 0 });
    } catch (err: unknown) {
      throw unknownStateIfKilled(err, { udid, command: 'simctl erase', timeoutMs: ERASE_TIMEOUT_MS });
    }
  }

  async sendToHome({ udid, signal }: DeviceTargetArgs): Promise<void> {
    // iOS 16+ SpringBoard is not directly accessible via simctl; use Settings app as proxy
    const bundleId = 'com.apple.Preferences';
    // @issue DTX-6127: both ceilings are wedge detectors, never patience limits.
    // The launch retries stay: a cold Preferences launch can fail transiently.
    await this._execSimctl({ args: ['launch', udid, bundleId], signal, retries: 10, timeout: LAUNCH_TIMEOUT_MS });
    await this._execSimctl({ args: ['terminate', udid, bundleId], signal, retries: 0, timeout: TERMINATE_TIMEOUT_MS });
  }

  private async _isBooted({ udid, signal }: DeviceTargetArgs): Promise<boolean> {
    const devices = await this.list({ query: { byId: udid }, signal });
    const device = devices[0];
    return device?.state === 'Booted' || device?.state === 'Booting';
  }

  private async _openSimulatorApp({ udid, signal }: DeviceTargetArgs): Promise<void> {
    try {
      await execWithRetries({
        file: 'open',
        args: ['-a', 'Simulator', '--args', '-CurrentDeviceUDID', udid],
        signal,
      });
    } catch {
      // Simulator.app may not be available (CI, headless) — non-fatal
    }
  }

  private _mergeLaunchArgs({ launchArgs, languageAndLocale }: MergeLaunchArgsInput): [string, string][] {
    // @issue DTX-6128: null-prototype — a `__proto__` key on a plain `{}` would vanish from argv silently.
    const args: Record<string, string> = Object.create(null) as Record<string, string>;
    for (const [k, v] of Object.entries(launchArgs)) {
      args[k] = String(v);
    }
    if (languageAndLocale?.language) args.AppleLanguages = `(${languageAndLocale.language})`;
    if (languageAndLocale?.locale) args.AppleLocale = languageAndLocale.locale;
    return Object.entries(args).map(([k, v]) => [`-${k}`, v]);
  }

  private _execSimctl({ args, signal, retries = 1, timeout, env }: ExecSimctlArgs): Promise<ExecResult> {
    return execWithRetries({ file: '/usr/bin/xcrun', args: ['simctl', ...args], signal, retries, timeout, env });
  }

  /**
   * applesimutils as a hard dependency of the calling verb (spec 006's
   * permissions path): a binary missing from PATH is an environmental fact
   * about this server, not the caller's mistake (same footing as the blob
   * lane's missing `zip`).
   * @issue DTX-6129: missing binary answers `DETOX_INTERNAL`, naming the binary and the install command.
   * @issue DTX-6125: `retries: 0` — the permissions writes restart SpringBoard.
   */
  private async _execApplesimutilsRequired({ args, signal }: ExecApplesimutilsArgs): Promise<ExecResult> {
    try {
      return await execWithRetries({
        file: 'applesimutils',
        args,
        signal,
        retries: 0,
        timeout: UTILITY_TIMEOUT_MS,
      });
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new DetoxError(
          'applesimutils is not on this server\'s PATH — install it with ' +
            '`brew tap wix/brew && brew install applesimutils` and restart the server',
          {
            code: DetoxErrorCode.DETOX_INTERNAL,
            details: { binary: 'applesimutils', install: 'brew tap wix/brew && brew install applesimutils' },
            cause: err,
          },
        );
      }
      throw err;
    }
  }

  private _execApplesimutils({ args, signal }: ExecApplesimutilsArgs): Promise<ExecResult> {
    // Bounded: listing runs inside the pool's allocation lock, and a wedged
    // CoreSimulator (a well-known simctl pathology) would otherwise stall
    // every allocation on the server, not just its own request.
    return execWithRetries({
      file: 'applesimutils',
      args,
      signal,
      retries: 1,
      timeout: LIST_TIMEOUT_MS,
    });
  }
}
