/**
 * `detox-compat` — the Detox 20 compatibility surface over the v21 client.
 *
 * The compat layer is v21-native. Old suites reach the new stack through the
 * surface this package owns (`device`, `element`, `by`, `expect`, `waitFor`),
 * and that surface means the currently selected device / app — bookkeeping
 * this module holds in module state (the one singleton in the client). This
 * surface is the meaning of `require('detox')` in the published package;
 * until publish it lives under its public name `detox-compat` (never an
 * `@detox-remote/*` path: spec helpers name it).
 *
 * Scope is measured, not guessed: a Detox 20 method the ported corpus calls
 * and this file does not implement is a typed refusal
 * (`DETOX_NOT_IMPLEMENTED` naming the method), never a silent no-op.
 * `traceCall` is absent, not refused: v20 itself marks it deprecated.
 *
 * Every async method accepts an optional trailing `signal` argument —
 * additive, so unedited v20 bodies (which never pass one) still run.
 *
 * Known deviations from Detox 20 semantics:
 *  - A resume is a real resume now (spec 006): v20's `newInstance` only
 *    decided whether to terminate first; here it maps to `app.foreground()`
 *    (see `resumeApp` below).
 *  - A resume of a dead app becomes a fresh launch, as `simctl launch` over a
 *    corpse did in v20 (see `resumeApp` below).
 *  - `openURL` reaches the app over the app channel when a handle is live,
 *    falling back to the device verb only otherwise — `simctl openurl` alone
 *    raises a SpringBoard confirmation this stack cannot dismiss (see
 *    `device.openURL` below).
 */
import {
  by as statelessBy,
  DetoxError,
  DetoxErrorCode,
  init as initClient,
  type AppElement,
  type AppExpectation,
  type AppMatcher,
  type AppWaitFor,
  type DetoxApp,
  type DeviceQuery,
  type StatusBarOverrides,
} from 'detox/internals';
import { getBundleIdFromBinary } from './bundle-id';
import { type LaunchArgs } from './launch-args';
import { compatStateBox, type CompatState, type ResolvedCompatApp } from './state';
import {
  normalizeURLBlacklist,
  serializeURLBlacklistForIOS,
  URL_BLACKLIST_LAUNCH_ARG,
} from './url-blacklist';
import { NOT_CONNECTED_MESSAGE, toV20Error, withV20Errors } from './v20-errors';

export { DetoxConstants } from './constants';
export { LaunchArgsEditor, ScopedLaunchArgsEditor } from './launch-args';

export interface CompatAppConfig {
  /**
   * What `device.selectApp(name)` matches. v20 looks apps up by their
   * `name:` field, not the config alias — the example
   * suite's `selectApp('example')` names the field shared by `ios.debug`
   * and `ios.release`, not either alias.
   */
  name: string;
  /**
   * Optional since spec 009: when absent it is derived from
   * `binaryPath`'s Info.plist at `init` — the PlistBuddy port in
   * `./bundle-id`. An app with neither `bundleId` nor `binaryPath` is an
   * init-time refusal naming both, never a deferred failure.
   */
  bundleId?: string;
  /**
   * Installed during `init()` when present: archived client-side and
   * uploaded over the blob lane (spec 007), so a remote server works the
   * same as a loopback one.
   */
  binaryPath?: string;
  /**
   * Per-app launch arguments from the old config. v20 seeds the local scope
   * of `device.appLaunchArgs` with these on every `selectApp`
   * (`RuntimeDevice.js:111-112`).
   */
  launchArgs?: LaunchArgs;
}

export interface CompatConfig {
  server: {
    url: string;
    headers?: Readonly<Record<string, string>>;
  };
  apps: readonly CompatAppConfig[];
  /** Allocation query, v21's own contract. Default: any iOS simulator. */
  device?: DeviceQuery;
}

/**
 * The v20 launch options this surface understands (spec 006's compat
 * mapping). Anything else v20 accepted — `resetAppState`,
 * `disableTouchIndicators` — is still a typed refusal naming itself, never a
 * silent discard.
 */
export interface CompatLaunchOptions {
  /** @issue DTX-4000: absent means true iff the app is not already running. */
  newInstance?: boolean;
  /** Reinstall before launching: terminate → uninstall → install (v20's order). */
  delete?: boolean;
  /** Applied before the launch, through `device.setPermissions`. */
  permissions?: Record<string, string>;
  launchArgs?: LaunchArgs;
  languageAndLocale?: { language?: string; locale?: string };
  /** At-launch payloads — mutually exclusive, counted by truthiness as in v20. */
  url?: string;
  sourceApp?: string;
  userNotification?: unknown;
  userActivity?: unknown;
}

/** v20's own launch-option vocabulary, for the unknown-key refusal below. */
const KNOWN_LAUNCH_OPTIONS = new Set([
  'newInstance',
  'delete',
  'permissions',
  'launchArgs',
  'languageAndLocale',
  'url',
  'sourceApp',
  'userNotification',
  'userActivity',
]);

/**
 * The three at-launch payloads. v20 enforces "at most one" across them
 * (`_assertHasSingleParam`) before anything reads them; the order here is
 * only the order of the refusal message, not a precedence.
 */
const PAYLOAD_OPTIONS = ['url', 'userNotification', 'userActivity'] as const;

/**
 * The two codes a resume must read as "the app is gone, launch a fresh one"
 * rather than as a failure. v20 had no such predicate: it launched over the
 * corpse and got a new process.
 */
const isDeadHandle = (err: unknown): boolean => {
  const code = (err as { code?: number } | null)?.code;
  return code === DetoxErrorCode.DETOX_APP_DIED || code === DetoxErrorCode.DETOX_STALE_HANDLE;
};

/** v20's `device.openURL` options bag, verbatim. */
export interface CompatOpenURLParams {
  url: string;
  sourceApp?: string;
}

/**
 * The surface's whole mutable state — session, device, launch-args editor —
 * lives in the state box (`./state`, spec 010): still the one singleton, now
 * shared across the multiple copies of this module a jest worker evaluates
 * (the environment's bundle, each file's sandboxed `require('detox')`).
 * Outside jest, one copy, one box.
 */
const box = compatStateBox();

const notInitialized = (method: string): DetoxError =>
  new DetoxError(`${method} was called before detox-compat init() (or after cleanup())`, {
    code: DetoxErrorCode.DETOX_NOT_INITIALIZED,
    details: { method },
  });

const notImplemented = (method: string): DetoxError =>
  new DetoxError(`${method} is not implemented on the compat surface yet`, {
    code: DetoxErrorCode.DETOX_NOT_IMPLEMENTED,
    details: { method },
  });

function requireState(method: string): CompatState {
  if (!box.state) throw notInitialized(method);
  return box.state;
}

interface SelectedApp {
  state: CompatState;
  app: ResolvedCompatApp;
}

function requireSelectedApp(method: string): SelectedApp {
  const current = requireState(method);
  if (!current.selected) {
    throw new DetoxError(`${method} needs a selected app — call device.selectApp(name) first`, {
      code: DetoxErrorCode.DETOX_NOT_INITIALIZED,
      details: { method },
    });
  }
  return { state: current, app: current.selected };
}

function requireLaunchedApp(method: string): DetoxApp {
  const current = requireState(method);
  if (!current.currentApp) {
    // v20's own sentence leads (`19.crash-handling` matches on it after an
    // explicit `terminateApp`), with what this surface knows behind it.
    throw new DetoxError(
      `${NOT_CONNECTED_MESSAGE} ${method} needs a launched app — call device.launchApp() first`,
      { code: DetoxErrorCode.DETOX_NOT_INITIALIZED, details: { method } },
    );
  }
  return current.currentApp;
}

/**
 * Connects to the Detox Server, allocates one device, and installs every
 * configured app that names a binary. When the config names exactly one app,
 * it is auto-selected (v20 behaviour); multi-app configs call
 * `device.selectApp(name)` themselves, as the old suites' `setup.js` does.
 */
export function init(config: CompatConfig, signal?: AbortSignal): Promise<void> {
  // @issue DTX-4001: the in-flight promise is part of the guard against an overlapping init().
  if (box.state !== undefined || box.pendingInit !== undefined) {
    return Promise.reject(
      new DetoxError('detox-compat is already initialized — cleanup() first', {
        code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
        details: { method: 'init' },
      }),
    );
  }
  box.pendingInit = doInit(config, signal).finally(() => {
    box.pendingInit = undefined;
  });
  return box.pendingInit;
}

async function doInit(config: CompatConfig, signal?: AbortSignal): Promise<void> {
  const names = new Set<string>();
  for (const app of config.apps) {
    if (names.has(app.name)) {
      // @issue DTX-4002: v20's own example config gives two aliases one `name:`; refuse the collision.
      throw new DetoxError(`init: duplicate app name "${app.name}" in the compat config`, {
        code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
        details: { method: 'init', parameter: 'apps' },
      });
    }
    names.add(app.name);
  }
  // A missing `bundleId` is derived from the binary here — at
  // init, before the uninstall below needs it, and never earlier (config
  // resolution must survive an app not yet built). Neither key means a typed
  // refusal naming both, never a deferred failure. The derivation runs only
  // when something is actually missing: the common all-ids-present path stays
  // synchronous, so `initClient` below is reached in the same tick it always
  // was (the fake-transport unit harness times its socket on that).
  const resolveApp = async (app: CompatAppConfig): Promise<ResolvedCompatApp> => {
    if (app.bundleId !== undefined) return { ...app, bundleId: app.bundleId };
    if (app.binaryPath === undefined) {
      throw new DetoxError(
        `init: app "${app.name}" has neither bundleId nor binaryPath — add a binaryPath (the bundle id is derived from the app) or a bundleId`,
        {
          code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
          details: { method: 'init', parameter: 'apps' },
        },
      );
    }
    return { ...app, bundleId: await getBundleIdFromBinary(app.binaryPath, signal) };
  };
  const apps: ResolvedCompatApp[] = config.apps.every((app) => app.bundleId !== undefined)
    ? config.apps.map((app) => ({ ...app, bundleId: app.bundleId as string }))
    : await Promise.all(config.apps.map(resolveApp));
  // The two extra fields are the runner-integration doors (spec 010): the
  // ambient provider is sampled per call, so it costs nothing until the jest
  // environment sets `box.ambient`; the unref flag is set by the environment
  // before init and false anywhere else.
  const initOptions = {
    server: { url: config.server.url, headers: config.server.headers },
    signal,
    ambient: () => box.ambient,
    unrefSocket: box.unrefSocket,
  };
  const session = await initClient(initOptions);
  try {
    const allocated = await session.allocateDevice({
      type: 'ios.simulator',
      device: config.device,
      signal,
    });
    for (const app of apps) {
      if (app.binaryPath !== undefined) {
        // @issue DTX-4003: v20's `reinstallApp` is uninstall then install (`DetoxWorker.js:292-300`).
        await allocated.uninstallApp(app.bundleId, { signal });
        await allocated.installApp(app.binaryPath, { signal });
      }
    }
    box.state = {
      session,
      device: allocated,
      apps,
      selected: apps.length === 1 ? apps[0] : undefined,
      currentApp: undefined,
    };
  } catch (err) {
    try {
      await session.disconnect();
    } catch {
      // The teardown's own failure must not mask why init failed.
    }
    throw err;
  }
}

/** Releases the device and closes the session; the surface goes back to uninitialized. */
export async function cleanup(signal?: AbortSignal): Promise<void> {
  // @issue DTX-4004: an already-aborted signal never defeats cleanup; the
  // trailing parameter exists only so every async method has the same shape.
  void signal;
  // @issue DTX-4005: a cleanup racing an in-flight init waits it out, then tears down what the init installed.
  if (box.pendingInit) await box.pendingInit.catch(() => undefined);
  const current = box.state;
  box.state = undefined;
  // The editor outlives the state by design (it is v20's device-level store),
  // so a second `init()` in the same process must not inherit the first
  // run's arguments — both scopes go back to empty here.
  box.launchArgsEditor.reset().shared.reset();
  if (current) await current.session.disconnect();
}

/**
 * Terminates the app the surface currently holds, tolerating an app that is
 * already gone — the shape `selectApp` and `launchApp({delete: true})` both
 * need. Clears the handle either way: after this returns, the surface holds
 * no app.
 */
async function terminateCurrentApp(current: CompatState, signal?: AbortSignal): Promise<void> {
  const outgoing = current.currentApp;
  if (!outgoing) return;
  current.currentApp = undefined;
  try {
    await outgoing.terminate({ signal });
  } catch (err) {
    if (!isDeadHandle(err)) throw err;
  }
}

/**
 * The launch arguments a fresh launch carries, v20's own composition
 * (`RuntimeDevice.js:135-139` + `AppleSimUtils._mergeLaunchArgs:530-548`):
 * the editor's merged view first, the call's own `launchArgs` on top, then
 * the URL-blacklist serializer over its one reserved key, then v20's `${v}`
 * stringification — which is also all the v21 wire accepts.
 *
 * `detoxServer`/`detoxSessionId` are not added here (v20's
 * `_prepareLaunchArgs`): in v21 the server mints both itself, and they are
 * two of the four reserved keys `launchApp` refuses.
 */
function prepareLaunchArgs(options: CompatLaunchOptions): PreparedLaunchArgs {
  const merged: LaunchArgs = { ...box.launchArgsEditor.get(), ...options.launchArgs };
  if (URL_BLACKLIST_LAUNCH_ARG in merged) {
    merged[URL_BLACKLIST_LAUNCH_ARG] = serializeURLBlacklistForIOS(
      merged[URL_BLACKLIST_LAUNCH_ARG],
    );
  }
  const out: Record<string, string | number | boolean> = {};
  for (const key of Object.keys(merged)) {
    const value = merged[key];
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      out[key] = value;
    } else {
      // @issue DTX-4006: v20 dropped nothing and quoted everything — an object reaches the
      // app as "[object Object]", an array as its joined elements. (The editor still deletes
      // null-valued keys, `launch-args.ts`; this is only about values handed to this one call.)
      out[key] = String(value);
    }
  }
  return Object.keys(out).length > 0 ? { launchArgs: out } : {};
}

/**
 * v20's resume (`RuntimeDevice.js:158-160`).
 * Delivers the payload, if any, before bringing the process back.
 * @issue DTX-4008: returns false when the handle is a corpse, so the caller falls back to a fresh launch.
 * @issue DTX-4009: `launchArgs`/`languageAndLocale` are silently discarded here, as v20 discards them on a resume.
 */
async function resumeApp(
  current: CompatState,
  options: CompatLaunchOptions,
  signal?: AbortSignal,
): Promise<boolean> {
  const app = current.currentApp;
  if (!app) return false;
  try {
    if (options.userNotification) {
      await app.sendUserNotification(options.userNotification, {
        delayUntilActive: true,
        signal,
      });
    } else if (options.userActivity) {
      await app.sendUserActivity(options.userActivity, { delayUntilActive: true, signal });
    } else if (options.url) {
      await app.openURL(options.url, {
        delayUntilActive: true,
        ...(options.sourceApp !== undefined ? { sourceApp: options.sourceApp } : {}),
        signal,
      });
    }
    await app.foreground({ signal });
    return true;
  } catch (err) {
    if (!isDeadHandle(err)) throw err;
    current.currentApp = undefined;
    return false;
  }
}

/** What {@link prepareLaunchArgs} hands the client: present only when non-empty. */
interface PreparedLaunchArgs {
  launchArgs?: Record<string, string | number | boolean>;
}

/** The body of `device.launchApp`; shared with `device.relaunchApp`. */
async function launchAppImpl(
  options: CompatLaunchOptions = {},
  signal?: AbortSignal,
): Promise<void> {
  const { state: current, app } = requireSelectedApp('device.launchApp');
  signal?.throwIfAborted();

  // @issue DTX-4010: `!== undefined`, not bare key presence — every check in this function
  // reads v20's launch options by value (v20 itself tests `if (params.resetAppState)`).
  const unsupported = Object.keys(options).filter(
    (key) =>
      !KNOWN_LAUNCH_OPTIONS.has(key) && (options as Record<string, unknown>)[key] !== undefined,
  );
  if (unsupported.length > 0) {
    throw new DetoxError(
      `launchApp options not implemented on the compat surface yet: ${unsupported.join(', ')}`,
      {
        code: DetoxErrorCode.DETOX_NOT_IMPLEMENTED,
        details: { method: 'device.launchApp', options: unsupported },
      },
    );
  }

  // @issue DTX-4011: v20 `_assertHasSingleParam` counts truthiness, not presence — `{url: undefined}` is not a payload.
  const payloads = PAYLOAD_OPTIONS.filter((key) => Boolean(options[key]));
  if (payloads.length > 1) {
    throw new DetoxError(
      `Call to 'launchApp(${JSON.stringify(options)})' must contain only one of ${JSON.stringify(PAYLOAD_OPTIONS)}.`,
      {
        code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
        details: { method: 'device.launchApp', options: payloads },
      },
    );
  }

  // v20's default: fresh unless already running.
  const newInstance = options.newInstance ?? current.currentApp === undefined;

  if (options.delete) {
    // @issue DTX-4012: terminate → uninstall → install (v20 lines 125-128); the terminate is
    // not redundant — an uninstall under a live app is what v20 guarded against.
    if (app.binaryPath === undefined) {
      throw new DetoxError(`launchApp({delete: true}): app "${app.name}" declares no binaryPath`, {
        code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
        details: { method: 'device.launchApp', parameter: 'delete' },
      });
    }
    await terminateCurrentApp(current, signal);
    await current.device.uninstallApp(app.bundleId, { signal });
    await current.device.installApp(app.binaryPath, { signal });
  }

  if (options.permissions) {
    // @issue DTX-4013: permissions are applied before the launch, through a device verb.
    await current.device.setPermissions(app.bundleId, options.permissions, { signal });
  }

  if (!newInstance && !options.delete && current.currentApp !== undefined) {
    // @issue DTX-4008: `false` means the handle was a corpse — fall through to a fresh launch.
    if (await resumeApp(current, options, signal)) return;
  }

  // @issue DTX-4014: a launch that dies before ready is v20's "early crash"; the rejection
  // leaves this surface in v20's wording (see `v20-errors.ts`).
  const handle = await current.device
    .launchApp(app.bundleId, {
      ...prepareLaunchArgs(options),
      ...(options.languageAndLocale !== undefined
        ? { languageAndLocale: options.languageAndLocale }
        : {}),
      ...(options.url ? { url: options.url } : {}),
      ...(options.url && options.sourceApp ? { sourceApp: options.sourceApp } : {}),
      ...(options.userNotification ? { userNotification: options.userNotification } : {}),
      ...(options.userActivity ? { userActivity: options.userActivity } : {}),
      signal,
    })
    .catch((err: unknown) => {
      throw toV20Error(err);
    });
  current.currentApp = handle;
}

/**
 * The `device` global: one stable object whose methods look up the live
 * state per call — so a body that captured it before `init()` (as v20's own
 * `setup.js` does at module load) still works after.
 */
export const device = {
  /** v20 exposes the platform synchronously; this server is iOS-only today. */
  getPlatform: (): 'ios' => 'ios',

  /** The platform id of the allocated device (v20 `device.id`). */
  get id(): string {
    const info = requireState('device.id').device.info;
    return 'udid' in info ? info.udid : info.adbName;
  },

  /** The device's display name (v20 `device.name`). */
  get name(): string {
    return requireState('device.name').device.info.name;
  },

  /** @issue DTX-4015: the OS string is not a v20 property; it is the accessor the ported `deviceInfo.js` util reads. */
  get os(): string {
    return requireState('device.os').device.info.os;
  },

  /**
   * @issue DTX-4016: faithful to v20 (`RuntimeDevice.js:93-110`) — matches the config's `name:`
   * field, terminates the outgoing app before the switch (including on the `null` internal
   * deselect), and refuses `undefined`.
   */
  async selectApp(name: string | null, signal?: AbortSignal): Promise<void> {
    const current = requireState('device.selectApp');
    signal?.throwIfAborted();
    if (name === undefined) {
      // @issue DTX-4016: v20 `cantSelectEmptyApp` — a JS fixture can pass undefined despite the TS signature.
      throw new DetoxError('selectApp: an app name (or null to deselect) is required', {
        code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
        details: { method: 'device.selectApp', parameter: 'name' },
      });
    }
    // Switching away from an app that already died must not fail the switch;
    // any other terminate failure is real news (see `terminateCurrentApp`).
    await terminateCurrentApp(current, signal);
    if (name === null) {
      current.selected = undefined;
      return;
    }
    const app = current.apps.find((candidate) => candidate.name === name);
    if (!app) {
      throw new DetoxError(`selectApp: no app named "${name}" in the compat config`, {
        code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
        details: { method: 'device.selectApp', parameter: 'name' },
      });
    }
    current.selected = app;
    // @issue DTX-4017: v20 `RuntimeDevice.js:111-112` — the local scope is reset and re-seeded from the incoming app's config on every select; `shared` survives.
    box.launchArgsEditor.reset().modify(app.launchArgs);
  },

  /**
   * Launches (or resumes) the selected app and makes its handle the target of
   * `element`/`expect`/`waitFor` — a port of v20's `RuntimeDevice.launchApp`
   * (`RuntimeDevice.js:116-185`), in its own order:
   *
   *   validate → delete?/newInstance? teardown → permissions → payload →
   *   resume or fresh launch.
   *
   * The one order v21 changes is invisible from here: `device.launchApp`
   * terminates first server-side, so the surface does not spend a second
   * round trip terminating before a fresh launch (v20's line 133) — it only
   * terminates explicitly where the next step needs a dead app, i.e. before
   * an uninstall.
   */
  async launchApp(options: CompatLaunchOptions = {}, signal?: AbortSignal): Promise<void> {
    await launchAppImpl(options, signal);
  },

  /**
   * v20 sugar: `relaunchApp` is `launchApp` with `newInstance` defaulted to
   * `true` (`RuntimeDevice.js:187-192`) — no server verb of its own.
   */
  async relaunchApp(options: CompatLaunchOptions = {}, signal?: AbortSignal): Promise<void> {
    // @issue DTX-4018: v20 `RuntimeDevice.js:188-190` guards on the value — a spread would put
    // an explicit `newInstance: undefined` back over the default and turn a relaunch into a resume.
    await launchAppImpl({ ...options, newInstance: options.newInstance ?? true }, signal);
  },

  /**
   * @issue DTX-4019: v20's `sendToHome` returned once the app was actually backgrounded; the
   * v21 device verb welds in no wait (spec 006), so the wait is composed here.
   */
  async sendToHome(signal?: AbortSignal): Promise<void> {
    const current = requireState('device.sendToHome');
    await current.device.sendToHome({ signal });
    const app = current.currentApp;
    if (!app) return;
    try {
      await app.waitForBackground({ signal });
    } catch (err) {
      // An app that already died while going home is not a failure of going home.
      if (!isDeadHandle(err)) throw err;
    }
  },

  /** Live payload to the last-launched app (the surface's current-app bookkeeping). */
  async sendUserNotification(payload: unknown, signal?: AbortSignal): Promise<void> {
    await requireLaunchedApp('device.sendUserNotification').sendUserNotification(payload, {
      signal,
    });
  },

  /** Live payload to the last-launched app (the surface's current-app bookkeeping). */
  async sendUserActivity(payload: unknown, signal?: AbortSignal): Promise<void> {
    await requireLaunchedApp('device.sendUserActivity').sendUserActivity(payload, { signal });
  },

  /** One frozen frame on the app channel; resolves when the app is ready again. */
  async reloadReactNative(signal?: AbortSignal): Promise<void> {
    await requireLaunchedApp('device.reloadReactNative').reloadReactNative({ signal });
  },

  // @issue DTX-4021: the sync-settings trio routes to the current app's handle — the setting
  // lives in one app's Detox instrumentation, so "no app launched" is the correct refusal.

  async enableSynchronization(signal?: AbortSignal): Promise<void> {
    await requireLaunchedApp('device.enableSynchronization').enableSynchronization({ signal });
  },

  async disableSynchronization(signal?: AbortSignal): Promise<void> {
    await requireLaunchedApp('device.disableSynchronization').disableSynchronization({ signal });
  },

  async setURLBlacklist(urls: readonly (string | RegExp)[], signal?: AbortSignal): Promise<void> {
    // @issue DTX-4022: v20 normalized RegExp entries into portable pattern strings on this path (`RuntimeDevice.js:334`).
    await requireLaunchedApp('device.setURLBlacklist').setURLBlacklist(
      normalizeURLBlacklist(urls) as string[],
      { signal },
    );
  },

  /** No-argument form only: terminates the current app (v20's common case). */
  async terminateApp(bundleId?: string, signal?: AbortSignal): Promise<void> {
    if (bundleId !== undefined) throw notImplemented('device.terminateApp(bundleId)');
    const current = requireState('device.terminateApp');
    const app = requireLaunchedApp('device.terminateApp');
    await app.terminate({ signal });
    // The tombstone must not stay installed: element traffic after an explicit terminate should
    // say "no app launched", not app-died.
    if (current.currentApp === app) current.currentApp = undefined;
  },

  /** Defaults to the selected app's binary, exactly like v20. */
  async installApp(binaryPath?: string, signal?: AbortSignal): Promise<void> {
    if (binaryPath !== undefined) {
      await requireState('device.installApp').device.installApp(binaryPath, { signal });
      return;
    }
    const { state: current, app } = requireSelectedApp('device.installApp');
    if (app.binaryPath === undefined) {
      throw new DetoxError(`installApp: app "${app.name}" declares no binaryPath`, {
        code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
        details: { method: 'device.installApp' },
      });
    }
    await current.device.installApp(app.binaryPath, { signal });
  },

  /** Defaults to the selected app's bundle id, exactly like v20. */
  async uninstallApp(bundleId?: string, signal?: AbortSignal): Promise<void> {
    const current = requireState('device.uninstallApp');
    const target = bundleId ?? requireSelectedApp('device.uninstallApp').app.bundleId;
    await current.device.uninstallApp(target, { signal });
  },

  /**
   * v20 signature: an options bag.
   * @issue DTX-4024: delivers the URL over the app channel when a live handle exists
   * (`RuntimeDevice.js:286-292` → `deliverPayload`); with no app launched it falls back to
   * the device verb, since `simctl openurl` raises a SpringBoard confirmation on iOS 26 that
   * blocks every later interaction.
   */
  async openURL(params: CompatOpenURLParams, signal?: AbortSignal): Promise<void> {
    const current = requireState('device.openURL');
    // @issue DTX-4025: v20 `RuntimeDevice.js:287-289` — a bad shape is a named error here, not a TypeError.
    if (typeof params !== 'object' || params === null || !params.url) {
      throw new DetoxError(
        "openURL must be called with JSON params, and a value for 'url' key must be provided. " +
          'example: await device.openURL({url: "url", sourceApp[optional]: "sourceAppBundleID"}',
        { code: DetoxErrorCode.DETOX_INVALID_ARGUMENT, details: { method: 'device.openURL' } },
      );
    }
    const app = current.currentApp;
    if (app) {
      await app.openURL(params.url, {
        ...(params.sourceApp !== undefined ? { sourceApp: params.sourceApp } : {}),
        signal,
      });
      return;
    }
    if (params.sourceApp !== undefined) throw notImplemented('device.openURL({ sourceApp })');
    await current.device.openURL(params.url, { signal });
  },

  async setLocation(lat: number, lon: number, signal?: AbortSignal): Promise<void> {
    await requireState('device.setLocation').device.setLocation(lat, lon, { signal });
  },

  async setStatusBar(overrides: StatusBarOverrides, signal?: AbortSignal): Promise<void> {
    await requireState('device.setStatusBar').device.setStatusBar(overrides, { signal });
  },

  async resetStatusBar(signal?: AbortSignal): Promise<void> {
    await requireState('device.resetStatusBar').device.resetStatusBar({ signal });
  },

  async setBiometricEnrollment(enabled: boolean, signal?: AbortSignal): Promise<void> {
    await requireState('device.setBiometricEnrollment').device.setBiometricEnrollment(enabled, {
      signal,
    });
  },

  async matchFace(signal?: AbortSignal): Promise<void> {
    await requireState('device.matchFace').device.matchFace({ signal });
  },

  async unmatchFace(signal?: AbortSignal): Promise<void> {
    await requireState('device.unmatchFace').device.unmatchFace({ signal });
  },

  async matchFinger(signal?: AbortSignal): Promise<void> {
    await requireState('device.matchFinger').device.matchFinger({ signal });
  },

  async unmatchFinger(signal?: AbortSignal): Promise<void> {
    await requireState('device.unmatchFinger').device.unmatchFinger({ signal });
  },

  async clearKeychain(signal?: AbortSignal): Promise<void> {
    await requireState('device.clearKeychain').device.clearKeychain({ signal });
  },

  async resetContentAndSettings(signal?: AbortSignal): Promise<void> {
    await requireState('device.resetContentAndSettings').device.resetContentAndSettings({
      signal,
    });
  },

  // ── Typed refusals: v20 verbs whose mechanism has not landed ────────────
  // (each names itself so a red parity run states its reason)

  shake(): Promise<never> {
    return Promise.reject(notImplemented('device.shake'));
  },
  setOrientation(): Promise<never> {
    return Promise.reject(notImplemented('device.setOrientation'));
  },
  resetAppState(): Promise<never> {
    return Promise.reject(notImplemented('device.resetAppState'));
  },
  takeScreenshot(): Promise<never> {
    return Promise.reject(notImplemented('device.takeScreenshot'));
  },
  captureViewHierarchy(): Promise<never> {
    return Promise.reject(notImplemented('device.captureViewHierarchy'));
  },
  generateViewHierarchyXml(): Promise<never> {
    return Promise.reject(notImplemented('device.generateViewHierarchyXml'));
  },
  pressBack(): Promise<never> {
    return Promise.reject(notImplemented('device.pressBack'));
  },
  reverseTcpPort(): Promise<never> {
    return Promise.reject(notImplemented('device.reverseTcpPort'));
  },
  unreverseTcpPort(): Promise<never> {
    return Promise.reject(notImplemented('device.unreverseTcpPort'));
  },

  /**
   * v20's launch-args accessor, ported whole (spec 006's compat mapping): a
   * synchronous editor whose contents ride the next fresh launch. It never
   * becomes a wire call and it holds no server state.
   */
  appLaunchArgs: box.launchArgsEditor,
};

/**
 * The `element` global: routes to the current app's handle,
 * late, per action.
 * @issue DTX-4026: `element(by.id('x'))` builds pure matcher data in Detox 20, so suites call it
 * wherever they like, including at describe time before any app exists — this returns a
 * stand-in that holds the matcher and resolves the app handle when an action is called.
 * @issue DTX-4027: only the element surface's own methods are forwarded; everything else reads
 * `undefined`, which is what makes `await element(...)` resolve to the stand-in instead of
 * hanging on a fake `then`.
 */
const ELEMENT_METHODS = new Set([
  'atIndex',
  'tap',
  'tapAtPoint',
  'longPress',
  'longPressAndDrag',
  'multiTap',
  'typeText',
  'replaceText',
  'clearText',
  'tapBackspaceKey',
  'tapReturnKey',
  'scroll',
  'scrollTo',
  'swipe',
  'pinch',
  'pinchWithAngle',
  'setColumnToValue',
  'setDatePickerDate',
  'adjustSliderToPosition',
  'performAccessibilityAction',
  'getAttributes',
  'takeScreenshot',
]);

/**
 * Keys the language and its tooling probe on any object — `await` reads
 * `then`, promise plumbing reads `catch`/`finally`, matchers read
 * `asymmetricMatch`, inspectors read `constructor`. None is an element verb,
 * and all must read `undefined` rather than the refusal below.
 */
const PROBED_KEYS = new Set([
  'then',
  'catch',
  'finally',
  'constructor',
  'asymmetricMatch',
  'nodeType',
  '$$typeof',
  'inspect',
]);

/**
 * How `expect`/`waitFor` get the real element out of a late-bound stand-in.
 * `Symbol.for`, not `Symbol` (spec 010): under jest, the element may be built
 * by one copy of this module (the exposed globals) and unwrapped by another
 * (the environment's matcher bundle) — the global symbol registry is what
 * makes the two agree.
 */
const RESOLVE_ELEMENT = Symbol.for('detox-compat.resolveElement');

interface LateBoundElement {
  [RESOLVE_ELEMENT]: () => AppElement;
}

export const element = (matcher: AppMatcher): AppElement => {
  // @issue DTX-4028: v20's `atIndex` mutates the element and returns it — the index belongs
  // to the stand-in, not to any one resolved element.
  let index: number | undefined;
  const resolve = (): AppElement => {
    const target = requireLaunchedApp('element').element(matcher);
    return index === undefined ? target : target.atIndex(index);
  };
  const proxy: AppElement = new Proxy({} as AppElement, {
    get(_target, property) {
      if (property === RESOLVE_ELEMENT) return resolve;
      if (property === 'atIndex') {
        return (value: number): AppElement => {
          // @issue DTX-4029: v20 `expectTwo.js:163-164` — a non-number is a named error, not an index quietly forwarded.
          if (typeof value !== 'number') {
            throw new DetoxError(`atIndex argument must be a number, got ${typeof value}`, {
              code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
              details: { method: 'element.atIndex' },
            });
          }
          index = value;
          return proxy;
        };
      }
      // @issue DTX-4030: printable — a fixture that logs an element must not die on "Cannot convert object to primitive value".
      if (property === Symbol.toPrimitive || property === 'toString') {
        return () => `element(${JSON.stringify(matcher)})`;
      }
      if (property === 'valueOf') return () => proxy;
      // @issue DTX-4027: symbols and the handful of string keys JavaScript itself probes read
      // undefined — `then` above all, or `await element(...)` would see a thenable.
      if (typeof property !== 'string' || PROBED_KEYS.has(property)) return undefined;
      if (!ELEMENT_METHODS.has(property)) {
        // @issue DTX-4031: not undefined — `el.somethingNew()` would die with a bare TypeError, which a bare `expectToThrow(fn)` in a ported fixture swallows as success.
        return () =>
          Promise.reject(
            new DetoxError(
              `element.${property} is not implemented on the compat surface yet`,
              {
                code: DetoxErrorCode.DETOX_NOT_IMPLEMENTED,
                details: { method: `element.${property}` },
              },
            ),
          );
      }
      // Async, so "no app is launched" rejects like every other action
      // failure instead of throwing past a `.catch` the fixture wrote (every
      // element method but `atIndex` is async in v20 too).
      return async (...args: unknown[]): Promise<unknown> => {
        const target = withV20Errors(resolve(), unwrapElement) as unknown as Record<
          string,
          (...a: unknown[]) => unknown
        >;
        return await target[property](...args);
      };
    },
  });
  return proxy;
};

/** Unwraps `element()`'s late-bound stand-in for the client's own `expect`/`waitFor`. */
function resolveElement(target: AppElement): AppElement {
  const late = (target as unknown as Partial<LateBoundElement>)[RESOLVE_ELEMENT];
  return typeof late === 'function' ? late() : target;
}

/**
 * The same unwrapping, for arguments: v20 fixtures pass elements into other
 * elements' actions (`longPressAndDrag(…, targetElement, …)`) and into
 * `waitFor(…).whileElement(…)`, and the client's serializer accepts only its
 * own `Element` there.
 */
const unwrapElement = (value: unknown): unknown =>
  typeof value === 'object' && value !== null
    ? resolveElement(value as AppElement)
    : value;

/** The `by` global: stateless predicate data, straight from the v21 client. */
export const by = statelessBy;

/** The `expect` global (element expectations only — suites import Jest's separately). */
const expectElement = (target: AppElement): AppExpectation =>
  withV20Errors(requireLaunchedApp('expect').expect(resolveElement(target)), unwrapElement);
export { expectElement as expect };

/** The `waitFor` global. */
export const waitFor = (target: AppElement): AppWaitFor =>
  withV20Errors(requireLaunchedApp('waitFor').waitFor(resolveElement(target)), unwrapElement);
