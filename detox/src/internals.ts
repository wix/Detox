/**
 * `detox/internals` — the public client dialect for Detox v21.
 *
 * The option and handle types here are the public contract; the behaviour
 * is wired in by spec 001 onward. The shapes were transposed from the
 * spec-001 prototype client into public naming: `init` + handles instead of
 * `DeviceAllocator`.
 *
 *   import { init } from 'detox/internals';
 *   await using detox = await init({ server: 'ws://localhost:3456', signal });
 *   await using device = await detox.allocateDevice({
 *     type: 'ios.simulator',
 *     device: { model: 'iPhone 17' },
 *     onProgress,
 *   });
 *   await device.boot();
 *   await device.release();
 *
 * Calls return a {@link DetoxOperation} — a promise you may also subscribe to.
 * `init` is the exception: no handle exists yet to hang a subscription on, so
 * connecting narrates through `options.onProgress` only.
 */
import { initSession } from './internals/session';
import { DetoxError, DetoxErrorCode } from './internals/errors';

/** Where the Detox Server lives, and how to authenticate to it. */
export interface DetoxServerAddress {
  /** WebSocket URL of the Detox Server, e.g. `ws://localhost:3456`. */
  url: string;
  /** Extra handshake headers, e.g. `{ Authorization: 'Bearer …' }`. */
  headers?: Readonly<Record<string, string>>;
}

/**
 * Per-operation payload carried by {@link DetoxProgressEventOf.detail}.
 *
 * Payloads are refined here, in this file, as operations grow real detail —
 * `unknown` until then. Not extensible by declaration merging: the operation
 * vocabulary is closed (see {@link DetoxOperationName}), so adding one is an
 * edit to this file either way.
 */
export interface DetoxOperations {
  connect: unknown;
  allocateDevice: unknown;
  boot: unknown;
  shutdown: unknown;
  release: unknown;
  // The device-utilities toolbelt.
  uninstallApp: unknown;
  openURL: unknown;
  setLocation: unknown;
  setStatusBar: unknown;
  resetStatusBar: unknown;
  setBiometricEnrollment: unknown;
  matchFace: unknown;
  unmatchFace: unknown;
  matchFinger: unknown;
  unmatchFinger: unknown;
  clearKeychain: unknown;
  resetContentAndSettings: unknown;
  // The app gateway.
  installApp: unknown;
  launchApp: unknown;
  // Launch options and app-state sync.
  setPermissions: unknown;
  sendToHome: unknown;
  foreground: unknown;
  waitForActive: unknown;
  waitForBackground: unknown;
  sendUserNotification: unknown;
  sendUserActivity: unknown;
  // Sync settings.
  enableSynchronization: unknown;
  disableSynchronization: unknown;
  setURLBlacklist: unknown;
}

/** Every long-running call the client can make. A closed vocabulary. */
export type DetoxOperationName = keyof DetoxOperations;

/**
 * A flyweight handle to a running operation, carried by every progress event.
 *
 * Carries no lifecycle state: the call's promise is the terminal state for its
 * caller (resolved = done, rejected = failed).
 */
export interface DetoxOperationRef<K extends DetoxOperationName = DetoxOperationName> {
  /** Stable for the lifetime of the operation; unique per client session. */
  readonly id: string;
  readonly name: K;
  /**
   * Set when this operation was started *by* another one — e.g. the boot inside
   * `allocateDevice`. Lets a single subscriber rebuild the operation tree.
   */
  readonly parent?: DetoxOperationRef;
  /** `Date.now()` when the operation was created. */
  readonly startedAt: number;
  /**
   * Captured once, at operation creation — never per event. Its stack points at
   * the caller's line, which is what makes a timeout 40 frames deep readable.
   * Reporters reached through {@link Detox.on} need it as much as the caller.
   */
  readonly origin: Error;
  /** Aborted when the operation is cancelled, by anyone, for any reason. */
  readonly signal: AbortSignal;
  /**
   * Cancels this operation (and its children). Safe to call from a handler.
   * The operation's promise then rejects with an `AbortError` carrying `reason`
   * as its `cause`.
   */
  abort(reason?: unknown): void;

  on(event: 'progress', listener: (event: DetoxProgressEvent) => void): this;
  on(event: 'end', listener: (event: DetoxOperationEndEvent) => void): this;
  off(event: 'progress', listener: (event: DetoxProgressEvent) => void): this;
  off(event: 'end', listener: (event: DetoxOperationEndEvent) => void): this;
}

/**
 * What every long-running call returns: awaitable *and* subscribable.
 *
 *   await op                      // plain promise — the default path
 *   op.on('progress', listener)   // the same channel `onProgress` sugars over
 *
 * A full `Promise`, not `PromiseLike`: callers (and `assert.rejects`) expect
 * `.catch()`/`.finally()`. Implementations must delegate `then`/`catch`/
 * `finally` to an inner promise rather than extend `Promise` — subclassing
 * drags in `Symbol.species` and rebuilds the object on every `.then()`.
 *
 * Two obligations that are easy to get wrong:
 *  - No progress may be emitted before the end of the microtask in which the
 *    operation was created, or a caller that subscribes right after the call
 *    would miss the first events.
 *  - A rejection must stay handled until someone subscribes or awaits, so that
 *    taking the handle without awaiting it cannot crash the process (the trap
 *    execa is well known for).
 */
export interface DetoxOperation<T, K extends DetoxOperationName = DetoxOperationName>
  extends DetoxOperationRef<K>,
    Promise<T> {}

interface DetoxOperationEndEventBase {
  readonly type: 'end';
  readonly operation: DetoxOperationRef;
  readonly durationMs: number;
  readonly timestamp: number;
}

/**
 * Emitted once, when an operation settles.
 *
 * A cross-cutting observer reached through {@link Detox.on} never sees the
 * call's promise, so this is its only way to know the operation is over — which
 * is what a "this click is taking too long" watchdog needs to stop watching.
 *
 * Discriminated on `ok` so that `if (!event.ok)` narrows `error` to a value
 * that is actually present.
 */
export type DetoxOperationEndEvent =
  | (DetoxOperationEndEventBase & { readonly ok: true })
  | (DetoxOperationEndEventBase & { readonly ok: false; readonly error: unknown });

/**
 * A progress event surfaced to {@link DetoxCallOptions.onProgress}: narration,
 * not state. `message` is for humans only — never parse it.
 *
 * `name` is duplicated from `operation.name`: TypeScript narrows only on
 * discriminants at the top level of a union member, so `event.operation.name`
 * would never narrow `event.detail`.
 */
export interface DetoxProgressEventOf<K extends DetoxOperationName> {
  readonly type: 'progress';
  readonly name: K;
  readonly operation: DetoxOperationRef<K>;
  readonly message?: string;
  readonly detail?: DetoxOperations[K];
  /** `Date.now()` at emission. */
  readonly timestamp: number;
}

/**
 * What a handler receives — a *distributed* union, so that narrowing on
 * `event.name` also narrows `event.detail`.
 */
export type DetoxProgressEvent = {
  [K in DetoxOperationName]: DetoxProgressEventOf<K>;
}[DetoxOperationName];

/**
 * Cancellation + progress options accepted by every long-running call.
 * AbortSignal-first: passing `signal` must cancel the underlying work, not just
 * the returned promise.
 *
 * A call inherits its session's signal (see {@link DetoxInitOptions.signal});
 * `signal` here only narrows further, composed via `AbortSignal.any`.
 *
 * `onProgress` receives events of this operation and of the operations it
 * starts — a per-call view of the subtree, not just of one node.
 */
export interface DetoxCallOptions {
  signal?: AbortSignal;
  onProgress?: (event: DetoxProgressEvent) => void;
}

/**
 * Options for {@link init}. Extends {@link DetoxCallOptions} because connecting
 * is itself an operation (`connect`) that can be slow and needs narrating —
 * and no `detox.on('operation')` listener can exist yet while it runs.
 */
export interface DetoxInitOptions extends DetoxCallOptions {
  /** The Detox Server: a URL for the simple case, an address for the rest. */
  server: string | DetoxServerAddress;
}

/** Narrowing query describing which device to allocate. */
export interface DeviceQuery {
  /** Model/product name, e.g. `iPhone 17` or `Pixel_7_API_34`. */
  model?: string;
  /** Exact platform identifier (udid / adb name) when the caller knows it. */
  deviceId?: string;
  /** OS version constraint, e.g. `17.2`. */
  os?: string;
}

/** The four device families the server can allocate. */
export type DeviceType =
  | 'ios.simulator'
  | 'ios.device'
  | 'android.emulator'
  | 'android.device';

/** Runtime state of an allocated device. */
export type DeviceState = 'shutdown' | 'booting' | 'booted' | 'shutting-down';

/**
 * Status-bar overrides for {@link DetoxDevice.setStatusBar}, mirroring the
 * Detox 20 flag vocabulary. Every field is optional and absent means
 * *untouched*, so overriding the clock cannot silently reset the battery.
 *
 * iOS-only for now: the flags are simctl's own vocabulary, and Android
 * parity gets to rule whether it can speak it rather than inheriting it by
 * accident.
 */
export interface StatusBarOverrides {
  /** Clock text, e.g. `9:41` — simctl also accepts an ISO date. */
  time?: string;
  dataNetwork?:
    | 'hide' | 'wifi' | '3g' | '4g' | 'lte' | 'lte-a' | 'lte+'
    | '5g' | '5g+' | '5g-uwb' | '5g-uc';
  wifiMode?: 'searching' | 'failed' | 'active';
  wifiBars?: 0 | 1 | 2 | 3;
  cellularMode?: 'notSupported' | 'searching' | 'failed' | 'active';
  cellularBars?: 0 | 1 | 2 | 3 | 4;
  operatorName?: string;
  batteryState?: 'charging' | 'charged' | 'discharging';
  /** Percentage, 0–100. */
  batteryLevel?: number;
}

/**
 * Options for {@link Detox.allocateDevice}. Allocation always yields a booted
 * device; {@link DetoxDevice.boot} / {@link DetoxDevice.shutdown} are for
 * explicit cycling.
 */
export interface AllocateDeviceOptions<T extends DeviceType = DeviceType>
  extends DetoxCallOptions {
  type: T;
  device?: DeviceQuery;
}

/* ───────────────────────────── The app gateway ──────────────────────────── */

/** Options every app-handle call accepts, AbortSignal-first like the rest. */
export interface AppCallOptions {
  readonly signal?: AbortSignal;
}

/** Options for live payload delivery ({@link DetoxApp.sendUserNotification} and kin). */
export interface AppPayloadOptions extends AppCallOptions {
  /**
   * Park delivery until the app's next activation (the frozen frame's
   * `delayPayload` flag) — the composition a v20 resume-with-payload needs:
   * `sendUserNotification(value, { delayUntilActive: true })` then
   * `foreground()`.
   */
  readonly delayUntilActive?: boolean;
}

/** {@link DetoxApp.openURL}'s options: a payload delivery plus v20's `sourceApp`. */
export interface AppOpenURLOptions extends AppPayloadOptions {
  /** Bundle id the URL claims to come from — passed through to the app verbatim. */
  readonly sourceApp?: string;
}

/**
 * Options for {@link DetoxDevice.launchApp} (spec 006): everything here is
 * what physically becomes the app's argv, plus at-launch payloads as values
 * and the caller-owned deadline. All optional — the frozen `{ signal }` calls
 * stay source-compatible. Validation is server-side and precedes every side
 * effect: a refused launch leaves a running instance untouched.
 */
export interface LaunchAppOptions extends DetoxCallOptions {
  /**
   * Extra launch arguments, `-key value` on the app's argv; values stringify
   * exactly as v20 iOS did (`String(v)`). Four keys are reserved and refused
   * (`detoxServer`, `detoxSessionId`, and the two payload path keys). There
   * is no blanket `detox*` reservation: `detoxEnableSynchronization` and
   * friends pass through as plain launch args.
   */
  launchArgs?: Record<string, string | number | boolean>;
  /**
   * `-AppleLanguages (lang)` / `-AppleLocale locale`, appended after the
   * user launch args — on a key collision, this wins (v20 behaviour).
   */
  languageAndLocale?: { language?: string; locale?: string };
  /**
   * At-launch open-URL payload (with optional `sourceApp`). Mutually
   * exclusive with `userNotification`/`userActivity` — presence-based, so an
   * empty string is a refusal, never a silent no-op.
   */
  url?: string;
  sourceApp?: string;
  /**
   * At-launch payloads as JSON values (max 1 MiB serialized). The server
   * materializes the value to its own file and hands the app that path — a
   * client path never crosses the wire, so the shape survives any relay.
   */
  userNotification?: unknown;
  userActivity?: unknown;
  /**
   * Deadline over the whole launch (accepting the verb → the app's own
   * `ready`), in ms — a whole number up to 2^31-1. Absent → the server
   * default (120 s). `0` is legal and means no server deadline — the
   * caller's `signal` is the only exit, and that is a real responsibility:
   * an unbounded launch you never cancel is a pending operation on the
   * device, and `device.release()` waits pending operations out (the
   * reclaim barrier), so cancel the launch before releasing.
   */
  deadlineMs?: number;
}

/** A point argument (`tap`, `longPress`), v20's own shape. */
export interface Point2D {
  x: number;
  y: number;
}

/**
 * A matcher built by {@link AppBy}. Pure predicate data — stateless,
 * mirroring Detox 20 where a matcher holds only its predicate tree
 * (`expectTwo.js:430-516`). @issue DTX-3002 (built via one app's `by`, legal
 * input to another app's `element`) and @issue DTX-3003 (the element, not
 * the matcher, decides which app's channel the interaction rides).
 * Combinators return new matchers (`and`) exactly as v20's do.
 */
export interface AppMatcher {
  and(matcher: AppMatcher): AppMatcher;
  withAncestor(ancestor: AppMatcher): AppMatcher;
  withDescendant(descendant: AppMatcher): AppMatcher;
}

/**
 * A matcher lane this client does not speak (the XCUITest/web lane): the
 * surface exists so ported suites fail typed (`DETOX_NOT_IMPLEMENTED` naming
 * the method), never with a bare TypeError.
 */
export type AppExcludedMatcherLane = Readonly<Record<string, (...args: unknown[]) => never>>;

/**
 * The stateless matcher builder, re-exported by every handle for ergonomics
 * (`const { by, element } = app`). It builds data and holds nothing. The
 * matcher families are v20's own (`expectTwo.js` `By`), regex forms included.
 */
export interface AppBy {
  readonly id: (value: string | RegExp) => AppMatcher;
  readonly text: (value: string | RegExp) => AppMatcher;
  readonly label: (value: string | RegExp) => AppMatcher;
  readonly accessibilityLabel: (value: string | RegExp) => AppMatcher;
  /** A native class name, or a semantic type (`'image'`, `'button'`, …). */
  readonly type: (value: string) => AppMatcher;
  readonly traits: (traits: readonly string[]) => AppMatcher;
  readonly value: (value: string) => AppMatcher;
  readonly web: AppExcludedMatcherLane;
  readonly system: AppExcludedMatcherLane;
}

/**
 * An element bound to one app's channel — the full v20 action surface
 * (`expectTwo.js` `Element`), serialized byte-for-byte. Every action accepts
 * a trailing {@link AppCallOptions} (AbortSignal-first); `tap` also accepts
 * it as the sole argument. `atIndex` mutates and returns the same element,
 * exactly as v20's does.
 */
export interface AppElement {
  atIndex(index: number): AppElement;
  tap(point?: Point2D | AppCallOptions, options?: AppCallOptions): Promise<void>;
  tapAtPoint(point?: Point2D, options?: AppCallOptions): Promise<void>;
  longPress(
    pointOrDuration?: Point2D | number,
    duration?: number,
    options?: AppCallOptions,
  ): Promise<void>;
  longPressAndDrag(
    duration: number,
    normalizedPositionX: number,
    normalizedPositionY: number,
    targetElement: AppElement,
    normalizedTargetPositionX?: number,
    normalizedTargetPositionY?: number,
    speed?: 'fast' | 'slow',
    holdDuration?: number,
    options?: AppCallOptions,
  ): Promise<void>;
  multiTap(times: number, options?: AppCallOptions): Promise<void>;
  tapBackspaceKey(options?: AppCallOptions): Promise<void>;
  tapReturnKey(options?: AppCallOptions): Promise<void>;
  typeText(text: string, options?: AppCallOptions): Promise<void>;
  replaceText(text: string, options?: AppCallOptions): Promise<void>;
  clearText(options?: AppCallOptions): Promise<void>;
  performAccessibilityAction(actionName: string, options?: AppCallOptions): Promise<void>;
  scroll(
    pixels: number,
    direction?: 'left' | 'right' | 'up' | 'down',
    startPositionX?: number,
    startPositionY?: number,
    options?: AppCallOptions,
  ): Promise<void>;
  scrollTo(
    edge: 'left' | 'right' | 'top' | 'bottom',
    startPositionX?: number,
    startPositionY?: number,
    options?: AppCallOptions,
  ): Promise<void>;
  swipe(
    direction: 'left' | 'right' | 'up' | 'down',
    speed?: 'fast' | 'slow',
    normalizedSwipeOffset?: number,
    normalizedStartingPointX?: number,
    normalizedStartingPointY?: number,
    options?: AppCallOptions,
  ): Promise<void>;
  setColumnToValue(column: number, value: string, options?: AppCallOptions): Promise<void>;
  setDatePickerDate(dateString: string, dateFormat: string, options?: AppCallOptions): Promise<void>;
  pinch(scale: number, speed?: 'fast' | 'slow', angle?: number, options?: AppCallOptions): Promise<void>;
  pinchWithAngle(
    direction: 'inward' | 'outward',
    speed?: 'fast' | 'slow',
    angle?: number,
    options?: AppCallOptions,
  ): Promise<void>;
  adjustSliderToPosition(position: number, options?: AppCallOptions): Promise<void>;
  /** Resolves with the app's own attributes payload, verbatim (v20 parity). */
  getAttributes(options?: AppCallOptions): Promise<unknown>;
  /** Typed refusal until the artifacts spec. */
  takeScreenshot(fileName?: string): Promise<never>;
}

/**
 * An expectation bound to one element (and through it, one app's channel) —
 * the full v20 surface, `.not` modifier included. `not` mutates this
 * expectation and returns it, exactly as v20's getter does.
 */
export interface AppExpectation {
  readonly not: AppExpectation;
  toBeVisible(percent?: number | AppCallOptions, options?: AppCallOptions): Promise<void>;
  toBeNotVisible(options?: AppCallOptions): Promise<void>;
  toBeFocused(options?: AppCallOptions): Promise<void>;
  toBeNotFocused(options?: AppCallOptions): Promise<void>;
  toExist(options?: AppCallOptions): Promise<void>;
  toNotExist(options?: AppCallOptions): Promise<void>;
  toHaveText(text: string | RegExp, options?: AppCallOptions): Promise<void>;
  toNotHaveText(text: string | RegExp, options?: AppCallOptions): Promise<void>;
  toHaveLabel(label: string, options?: AppCallOptions): Promise<void>;
  toNotHaveLabel(label: string, options?: AppCallOptions): Promise<void>;
  toHaveId(id: string, options?: AppCallOptions): Promise<void>;
  toNotHaveId(id: string, options?: AppCallOptions): Promise<void>;
  toHaveValue(value: string, options?: AppCallOptions): Promise<void>;
  toNotHaveValue(value: string, options?: AppCallOptions): Promise<void>;
  toHaveSliderPosition(position: number, tolerance?: number, options?: AppCallOptions): Promise<void>;
  toHaveToggleValue(value: boolean, options?: AppCallOptions): Promise<void>;
}

/**
 * The `waitFor` chain — full v20 shape (expectations mutate the clause and
 * return it; `whileElement` attaches an actionable element whose action is
 * the terminal). `withTimeout` sends the v20 `{...expectation, timeout}`
 * invocation, a `whileElement` action sends `{...action, while:
 * {...expectation}}`, both on the invoke lane — the app enforces the clock,
 * never the client. The chain validates its arguments with v20's rules, so
 * a bad fixture fails for the v20 reason.
 * Terminals accept a trailing {@link AppCallOptions} (AbortSignal-first),
 * which v20 did not have.
 */
export interface AppWaitFor {
  readonly not: AppWaitFor;
  toBeVisible(percent?: number): AppWaitFor;
  toBeNotVisible(): AppWaitFor;
  toExist(): AppWaitFor;
  toNotExist(): AppWaitFor;
  toHaveText(text: string | RegExp): AppWaitFor;
  toNotHaveText(text: string | RegExp): AppWaitFor;
  toHaveLabel(label: string): AppWaitFor;
  toNotHaveLabel(label: string): AppWaitFor;
  toHaveId(id: string): AppWaitFor;
  toNotHaveId(id: string): AppWaitFor;
  toHaveValue(value: string): AppWaitFor;
  toNotHaveValue(value: string): AppWaitFor;
  toBeFocused(): AppWaitFor;
  toBeNotFocused(): AppWaitFor;
  withTimeout(ms: number, options?: AppCallOptions): Promise<void>;
  whileElement(matcher: AppMatcher): AppWaitFor;
  tap(point?: Point2D | AppCallOptions, options?: AppCallOptions): Promise<void>;
  tapAtPoint(point?: Point2D, options?: AppCallOptions): Promise<void>;
  longPress(
    pointOrDuration?: Point2D | number,
    duration?: number,
    options?: AppCallOptions,
  ): Promise<void>;
  multiTap(times: number, options?: AppCallOptions): Promise<void>;
  tapBackspaceKey(options?: AppCallOptions): Promise<void>;
  tapReturnKey(options?: AppCallOptions): Promise<void>;
  typeText(text: string, options?: AppCallOptions): Promise<void>;
  replaceText(text: string, options?: AppCallOptions): Promise<void>;
  clearText(options?: AppCallOptions): Promise<void>;
  scroll(
    pixels: number,
    direction?: 'left' | 'right' | 'up' | 'down',
    startPositionX?: number,
    startPositionY?: number,
    options?: AppCallOptions,
  ): Promise<void>;
  scrollTo(edge: 'left' | 'right' | 'top' | 'bottom', options?: AppCallOptions): Promise<void>;
  swipe(
    direction: 'left' | 'right' | 'up' | 'down',
    speed?: 'fast' | 'slow',
    normalizedSwipeOffset?: number,
    options?: AppCallOptions,
  ): Promise<void>;
  setColumnToValue(column: number, value: string, options?: AppCallOptions): Promise<void>;
  setDatePickerDate(dateString: string, dateFormat: string, options?: AppCallOptions): Promise<void>;
  performAccessibilityAction(actionName: string, options?: AppCallOptions): Promise<void>;
  pinch(scale: number, speed?: 'fast' | 'slow', angle?: number, options?: AppCallOptions): Promise<void>;
  pinchWithAngle(
    direction: 'inward' | 'outward',
    speed?: 'fast' | 'slow',
    angle?: number,
    options?: AppCallOptions,
  ): Promise<void>;
}

/**
 * The handle `device.launchApp()` resolves to: it owns `element`/`expect`/
 * `waitFor` (the frozen product constraint — no global singletons, no
 * implicit app), with `by` riding along for one-line destructuring. All
 * members are bound properties: `const { by, element, expect, waitFor } =
 * app` must work.
 *
 * The handle is a future event surface: the dialect's `on(...)` idiom
 * continues here — `app.on('idlechange', …)` and kin land with the
 * synchronization contract. Nothing in this shape may preclude subscriptions.
 */
export interface DetoxApp extends AsyncDisposable {
  readonly bundleId: string;
  /** Real OS pid of the launched process — externally verifiable. */
  readonly pid: number;
  readonly by: AppBy;
  readonly element: (matcher: AppMatcher) => AppElement;
  readonly expect: (element: AppElement) => AppExpectation;
  readonly waitFor: (element: AppElement) => AppWaitFor;
  /**
   * Reloads the React Native bridge in place (the app process survives):
   * resolves once the app reports itself ready again. The wire cost is one
   * frozen `reactNativeReload` frame answered by a `ready` — v20 parity,
   * where this is the second-most-called verb in real suites. On a non-RN
   * app the frozen native answers `ready` immediately
   * (`DetoxManager.swift:369-372`), so the call is a fast no-op there — a
   * reload of nothing, not a hang. The frozen dialect cannot correlate
   * readys to reloads (one shared sentinel id), so a spontaneous native
   * `ready` arriving mid-call can resolve it early — inherited from v20.
   */
  readonly reloadReactNative: (options?: AppCallOptions) => Promise<void>;
  /**
   * Terminates the app: kills the OS process, closes its gateway session, and
   * invalidates this handle — and only this handle; sibling apps on the same
   * device keep working.
   */
  readonly terminate: (options?: AppCallOptions) => Promise<void>;
  /**
   * Brings the (backgrounded) app back to the foreground — a resume, never a
   * relaunch (spec 006): same OS process, same handle, same live session; no
   * new argv, no second handshake. Resolves on the app's
   * own `waitForActiveDone` — the server never guesses app state. A resume
   * takes no launch options, by type: new argv needs a new process, i.e.
   * `device.launchApp`. A dead handle (terminated, superseded, crashed)
   * answers `DETOX_APP_DIED` — a foreground cannot resurrect a tombstone.
   * Signal-only: no deadline parameter.
   */
  readonly foreground: (options?: AppCallOptions) => Promise<void>;
  /**
   * Resolves when the app itself reports active (foreground) — the frozen
   * `waitForActive` frame answered by the app's own `waitForActiveDone`.
   * Signal-only; the server keeps no state shadow.
   */
  readonly waitForActive: (options?: AppCallOptions) => Promise<void>;
  /** {@link DetoxApp.waitForActive}'s background twin. */
  readonly waitForBackground: (options?: AppCallOptions) => Promise<void>;
  /**
   * Turns the app's Detox synchronization back on — one frozen
   * `setSyncSettings {enabled: true}` frame answered by the app's own
   * `setSyncSettingsDone` (v20 `device.enableSynchronization`,
   * `IosDriver.js:19-21`). The setting belongs to this app's instrumentation,
   * which is why the verb lives on the handle, not the device.
   */
  readonly enableSynchronization: (options?: AppCallOptions) => Promise<void>;
  /**
   * Turns the app's Detox synchronization off — every later action/expect
   * fires immediately instead of waiting for idle (v20
   * `device.disableSynchronization`). Same frame, `{enabled: false}`.
   */
  readonly disableSynchronization: (options?: AppCallOptions) => Promise<void>;
  /**
   * Replaces the app's URL blacklist — network calls matching any of these
   * regex strings are ignored by the synchronization idle-wait (v20
   * `device.setURLBlacklist`; the at-launch spelling remains
   * `detoxURLBlacklistRegex` in launch args). Frame: `{blacklistURLs}`.
   */
  readonly setURLBlacklist: (urls: readonly string[], options?: AppCallOptions) => Promise<void>;
  /**
   * Delivers a user-notification payload to the running app, as a JSON value
   * (max 1 MiB serialized) — the server materializes it and sends the frozen
   * `deliverPayload` frame; resolves on the app's `deliverPayloadDone`.
   * `delayUntilActive` parks delivery until the next activation — compose it
   * with {@link DetoxApp.foreground} for v20's resume-with-payload shape.
   */
  readonly sendUserNotification: (payload: unknown, options?: AppPayloadOptions) => Promise<void>;
  /** {@link DetoxApp.sendUserNotification} for a user-activity payload. */
  readonly sendUserActivity: (payload: unknown, options?: AppPayloadOptions) => Promise<void>;
  /**
   * Hands the running app a deep link, over the app channel — the third
   * payload of the same frozen `deliverPayload` frame, and the door v20's
   * `device.openURL` used on iOS (`RuntimeDevice.js:286-292`).
   *
   * Not the same verb as {@link DetoxDevice.openURL}, which asks the device
   * to open a URL (`simctl openurl`) and therefore goes through SpringBoard:
   * measured on iOS 26, that route raises a modal `Open in "…"?` confirmation
   * that no automation lane here can dismiss, and it addresses whichever app
   * claims the scheme rather than this handle. Use the device verb to test
   * "another app opened us"; use this one to hand this app a link.
   *
   * `delayUntilActive` parks the delivery until the next activation, the
   * composition a resume-with-URL needs.
   */
  readonly openURL: (url: string, options?: AppOpenURLOptions) => Promise<void>;
}

interface DeviceInfoBase {
  /** Allocation handle id, scoped to the server — not the platform id. */
  readonly allocationId: string;
  readonly name: string;
  readonly os: string;
}

/**
 * Static description of an allocated device — a discriminated union on `type`,
 * so `info.udid` / `info.adbName` narrow instead of being optional everywhere.
 */
export type DeviceInfo =
  | (DeviceInfoBase & { readonly type: 'ios.simulator'; readonly udid: string })
  | (DeviceInfoBase & { readonly type: 'ios.device'; readonly udid: string })
  | (DeviceInfoBase & { readonly type: 'android.emulator'; readonly adbName: string })
  | (DeviceInfoBase & { readonly type: 'android.device'; readonly adbName: string });

/** The `DeviceInfo` member that corresponds to a given {@link DeviceType}. */
export type DeviceInfoOf<T extends DeviceType> = Extract<DeviceInfo, { type: T }>;

/**
 * Handle to a single allocated device.
 *
 * `AsyncDisposable`, so `await using device = …` returns it to the pool even if
 * the test throws or times out — otherwise a shared LAN server keeps the
 * simulator allocated until something else times it out.
 */
export interface DetoxDevice<Info extends DeviceInfo = DeviceInfo> extends AsyncDisposable {
  /** Static description of this device, populated at allocation time. */
  readonly info: Info;
  /**
   * Current state of the device.
   *
   * Must reflect out-of-band changes too: if something shuts the device down
   * behind our back, the server pushes the new state and this follows. It is
   * not a cache of what our own calls did.
   */
  readonly state: DeviceState;
  /**
   * Boots the device. Idempotent: booting an already-booted device resolves
   * rather than throwing. Allocation already boots, so this is for explicit
   * cycles — and a no-op on physical devices, which are simply on.
   */
  boot(options?: DetoxCallOptions): DetoxOperation<void, 'boot'>;
  /** Shuts the device down without giving it back. Idempotent, like `boot`. */
  shutdown(options?: DetoxCallOptions): DetoxOperation<void, 'shutdown'>;
  /** Returns the device to the server pool. */
  release(options?: DetoxCallOptions): DetoxOperation<void, 'release'>;

  // ── The device-utilities toolbelt ────────────────────────────────────────
  // Sugar follows Detox 20 (`setLocation(lat, lon)`, not a params bag), with
  // cancellation/narration options last like every other call in the dialect.

  /**
   * Ensures the named app is not installed. Idempotent by the tool's own
   * semantics: uninstalling an app that is not there succeeds.
   */
  uninstallApp(appId: string, options?: DetoxCallOptions): DetoxOperation<void, 'uninstallApp'>;
  /**
   * Opens a URL on the device. The string is handed to the device untouched —
   * the server never dereferences it, resolves it, or reads its scheme.
   */
  openURL(url: string, options?: DetoxCallOptions): DetoxOperation<void, 'openURL'>;
  /** Sets the device's simulated GPS position. */
  setLocation(lat: number, lon: number, options?: DetoxCallOptions): DetoxOperation<void, 'setLocation'>;
  /** Overrides the fields of the status bar named in `overrides`, and only those. */
  setStatusBar(
    overrides: StatusBarOverrides,
    options?: DetoxCallOptions,
  ): DetoxOperation<void, 'setStatusBar'>;
  /** Clears every status-bar override. */
  resetStatusBar(options?: DetoxCallOptions): DetoxOperation<void, 'resetStatusBar'>;
  /** Enrolls (or un-enrolls) a biometric identity — persistent device state. */
  setBiometricEnrollment(
    enabled: boolean,
    options?: DetoxCallOptions,
  ): DetoxOperation<void, 'setBiometricEnrollment'>;
  /** Delivers a successful Face ID event. One-shot: there is no state to read back. */
  matchFace(options?: DetoxCallOptions): DetoxOperation<void, 'matchFace'>;
  /** Delivers a failed Face ID event. */
  unmatchFace(options?: DetoxCallOptions): DetoxOperation<void, 'unmatchFace'>;
  /** Delivers a successful Touch ID event. */
  matchFinger(options?: DetoxCallOptions): DetoxOperation<void, 'matchFinger'>;
  /** Delivers a failed Touch ID event. */
  unmatchFinger(options?: DetoxCallOptions): DetoxOperation<void, 'unmatchFinger'>;
  /** Wipes the device's keychain. */
  clearKeychain(options?: DetoxCallOptions): DetoxOperation<void, 'clearKeychain'>;
  /**
   * Wipes content and settings, and hands the device back live: the server
   * owns the whole shutdown → erase → boot choreography, so the canonical
   * composition is `await device.resetContentAndSettings()` followed straight
   * by a launch. Cancelling it never boots the device back up, and never kills
   * the erase in flight — the device comes back cold, uncorrupted, still yours.
   */
  resetContentAndSettings(
    options?: DetoxCallOptions,
  ): DetoxOperation<void, 'resetContentAndSettings'>;

  // ── The app gateway ──────────────────────────────────────────────────────

  /**
   * Installs an app bundle, named either as a local path or an http(s) URL.
   *
   * - A path names a build on this machine: the client archives it and
   *   uploads it over the blob lane (spec 007 — same server address, plain
   *   HTTP, content-addressed and cached), so it works off loopback exactly
   *   like everything else; a re-run of an unchanged build uploads nothing.
   * - A URL names an app archive
   *   (`.zip` / `.tar.gz` / `.tgz` / `.tar`) that the server downloads,
   *   unpacks, and installs. Unlike a path it works off loopback — a URL
   *   dereferences no server file. Give a farm server the freshest build's
   *   link and every run installs it. Caching, credentials and integrity
   *   pinning are not yet supported; a malformed/oversized/undecodable link
   *   fails typed, and a link that simply does not work fails promptly — a
   *   hanging host times out in seconds, not minutes.
   */
  installApp(appPath: string, options?: DetoxCallOptions): DetoxOperation<void, 'installApp'>;

  /**
   * Launches the app and resolves with its {@link DetoxApp} handle once the
   * app itself reports ready — a handshake, never a fire-and-forget, and
   * always a fresh launch: a launch over a still-running instance terminates
   * it first; the previous handle (if any) stays permanently dead while the
   * fresh one works. Resume is not a launch option — it is the handle's own
   * {@link DetoxApp.foreground}. Options (spec 006): launch args,
   * language/locale, at-launch payloads as values, `deadlineMs`.
   */
  launchApp(bundleId: string, options?: LaunchAppOptions): DetoxOperation<DetoxApp, 'launchApp'>;

  /**
   * Sets TCC/notification permissions for an app, before launching it — its
   * own verb, never a launch option (spec 006). `permissions` is v20's
   * vocabulary (`{ camera: 'YES', location: 'inuse', … }`); unknown
   * services and unknown values are typed refusals, closing v20's two silent
   * holes. No app-install precondition — TCC rows are keyed by bundle id.
   *
   * Blast radius: the applesimutils-backed services (`notifications`,
   * `health`, `homekit`, `speech`, `faceid`, `userTracking`, and
   * `contacts`/`photos` outside `limited`) restart SpringBoard — every app
   * on the device loses foreground state, and sibling app handles may
   * observe their app backgrounded or killed. Sequence permissions before
   * launches, as v20 did.
   */
  setPermissions(
    appId: string,
    permissions: Record<string, string>,
    options?: DetoxCallOptions,
  ): DetoxOperation<void, 'setPermissions'>;

  /**
   * Sends the device to the home screen. A device verb: it works with no
   * live instrumented app, and welds in no background wait —
   * compose `await device.sendToHome(); await app.waitForBackground()` when
   * the sync matters (spec 006).
   */
  sendToHome(options?: DetoxCallOptions): DetoxOperation<void, 'sendToHome'>;
}

/**
 * Root handle returned by {@link init}. Owns the connection to the Detox Server.
 * Not a global singleton — every session gets its own handle.
 *
 * Disposing it releases every device still allocated through it, then closes
 * the connection.
 */
export interface Detox extends AsyncDisposable {
  /**
   * Allocates a device from the server's pool. The requested `type` is carried
   * into the result, so `info` needs no re-narrowing at the call site.
   */
  allocateDevice<T extends DeviceType>(
    options: AllocateDeviceOptions<T>,
  ): DetoxOperation<DetoxDevice<DeviceInfoOf<T>>, 'allocateDevice'>;

  /**
   * The cross-cutting channel: fires for *every* operation in this session, at
   * creation time, before it starts reporting. Subscribe to the ref you get for
   * that operation's own progress/end.
   *
   * This is the seam for things that must not be hardcoded into each call —
   * IDE integrations, test-framework reporters, timeline artifacts, and slow-
   * operation watchdogs. `options.onProgress` is per-call sugar; this is the
   * session-wide observer.
   */
  on(event: 'operation', listener: (operation: DetoxOperationRef) => void): this;
  off(event: 'operation', listener: (operation: DetoxOperationRef) => void): this;

  /**
   * Closes the connection. That is the whole cleanup: the server reclaims
   * every device the connection held the moment it drops, so there is no
   * per-device goodbye and no clock. Always terminal, for every caller:
   * concurrent calls await the same close. `[Symbol.asyncDispose]` is an
   * alias for it.
   */
  disconnect(): Promise<void>;
}

/**
 * The error taxonomy (spec 004): one hierarchy, rooted at `DetoxError`.
 * `.name` reads (and is the only signal that survives a Jest reporter's
 * serialization); `.code` — from `DetoxErrorCode` — is what in-process code
 * branches on:
 *
 *   if (err.code === DetoxErrorCode.DETOX_POOL_EXHAUSTED) retryLater();
 *
 * Defined in `@detox-remote/core` because the server stamps the same numbers
 * and cannot import this package. A code with no class of its own arrives as
 * base `DetoxError` with `.code` and `.details` intact — the same path an
 * unknown code from a newer server takes.
 */
export {
  DetoxError,
  AbortError,
  DetoxConnectionError,
  DevicePoolExhaustedError,
  NoMatchingDeviceError,
  DeviceUnknownStateError,
  DetoxErrorCode,
} from './internals/errors';

/**
 * The stateless matcher builder, session-free by construction: a matcher is
 * only predicate data. Identical to every app handle's own `.by` — exported
 * at module level so a layer that routes matchers to "the current app" (the
 * compat surface) can build them without holding any handle first.
 */
export { statelessBy as by } from './internals/app';

/**
 * Rejected by entry points of this module that a future spec still has to
 * implement (`init` itself graduated with spec 001).
 */
export class DetoxNotImplementedError extends DetoxError {
  constructor(message = 'not implemented yet') {
    super(message, { code: DetoxErrorCode.DETOX_NOT_IMPLEMENTED });
    this.name = 'DetoxNotImplementedError';
  }
}

/**
 * Connects to a Detox Server and returns the root {@link Detox} handle.
 *
 * It *rejects* rather than throws (even on a dead address), because the
 * declared return type is a promise and `init(…).catch(…)` must reach the
 * handler.
 */
export function init(options: DetoxInitOptions): Promise<Detox> {
  return initSession(options);
}
