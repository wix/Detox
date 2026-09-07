/**
 * The app gateway (spec 003, per device since spec 015): the app-facing
 * websocket listener speaking the frozen native dialect `{type, messageId,
 * params}`. A library now — a driver instantiates one per booted device and
 * closes it with the device; the server itself opens none.
 *
 * v20's standalone DetoxServer relay disappears in v21 — its "tester" half is
 * the Detox Server now, and only the testee-facing half is ported here (source:
 * Detox 20 `AppConnectionHandler.js` / `AnonymousConnectionHandler.js`, and the
 * native counterparts `WebSocket.swift` / `DetoxManager.swift`, which define
 * what a real app sends and survives).
 *
 * Hard rules inherited from the frozen native side:
 *  - every app-bound frame carries a numeric `messageId` (the native
 *    force-unwraps it — `WebSocket.swift:112`);
 *  - every app-bound `type` is one the native switch knows (unknown types
 *    `fatalError` — `DetoxManager.swift:419-421`), so this gateway only ever
 *    emits `loginSuccess`, `isReady`, `invoke` and the frozen verbs;
 *  - binary frames are accepted inbound; text is emitted.
 *  - inbound parsing tolerates v20's trailing `'\n '` framing quirk (see
 *    `parseFrame` below).
 *
 * Identity: no tokens on this port — a launched app can send no headers.
 * The listener IS the device: whoever dials it is on that device, and the
 * login's session id says which app. Any well-formed login is accepted with
 * the launched app's choreography (`loginSuccess` echoing its id, then the
 * `isReady` probe), so an app launched outside Detox — Xcode, a finger, zero
 * launch arguments — is attachable. A raw login under an id whose session is
 * alive is turned away — the live session keeps the id until its own socket
 * closes; superseding it is `launch`'s explicit act (`supersede`), at the
 * moment of its spawn.
 *
 * No queueing, v20 parity: an invoke for a dead session is an error surfaced
 * to the caller, never a buffer (`TesterConnectionHandler.js:16-33`).
 */
import type { IncomingMessage } from 'node:http';

import { WebSocketServer, type WebSocket, type RawData } from 'ws';
import { AbortError, DetoxError, DetoxErrorCode } from '@detox-remote/core';
import type { InvokeResult } from '@detox-remote/protocol';
import { describeError, serverLog } from './log-sink';

/** One frame of the frozen native dialect. */
interface FrozenFrame {
  type: string;
  messageId: number;
  params?: Record<string, unknown>;
}

/** The frozen ready/isReady sentinel (`DetoxManager.swift:112`, v20 `actions.js:56`). */
const READY_SENTINEL_MESSAGE_ID = -1000;

/**
 * Where invoke ids start. Non-negative and strictly increasing per session, so
 * the frozen sentinels (`-1000` ready/isReady, `-1` testerDisconnected) can
 * never collide with a live request — the bug class v20 carries
 * (`actions.js:56,75` share `-1000`). `0` is skipped because the login echo
 * already used it (`WebSocket.swift:122-124` hardcodes login id 0): one id, one
 * conversation.
 */
const FIRST_INVOKE_MESSAGE_ID = 1;

/**
 * How long a fresh connection gets to present its login before the socket
 * is reaped. A silent socket is a wedged app or a stray local process.
 */
const LOGIN_DEADLINE_MS = 30_000;

/**
 * Ceiling on one inbound frame. The native's biggest payloads (view
 * hierarchies in `testFailed` details) are single-digit megabytes; ws's
 * default is 100 MiB, which on a token-less port is an invitation.
 */
const MAX_FRAME_BYTES = 16 * 1024 * 1024;

/** How long `close()` waits for polite goodbyes before terminating sockets. */
const CLOSE_GRACE_MS = 1_000;

export interface AppGatewayOptions {
  /**
   * Interface to bind. Loopback by default — simulator apps are host
   * processes, so loopback reaches every app this server can launch, and
   * with no tokens on this port the bind is the whole boundary.
   */
  host?: string;
  /**
   * The port to try first (the iOS driver asks for the native default,
   * 8099, so the zero-argument Xcode flow works). Taken when free, else an
   * ephemeral port — first come first served across every server on the
   * machine. Absent → ephemeral.
   */
  preferredPort?: number;
  /** The device this listener belongs to (the driver's own id) — carried on every session's error payload. */
  deviceId?: string;
  /** The driver's decoding of a session id into a bundle id. The identity by default. */
  decodeBundleId?: (sessionId: string) => string;
  /** Test seam for {@link LOGIN_DEADLINE_MS}; production uses the default. */
  loginDeadlineMs?: number;
  /** Test seam for {@link CLOSE_GRACE_MS}; production uses the default. */
  closeGraceMs?: number;
}

/** A launch's claim on the next login under its session id. */
export interface PendingApp {
  /** Resolves once an app logged in under the id (login answered, `isReady` probed). */
  readonly session: Promise<AppSession>;
  /** Withdraws the claim; the promise rejects if still pending. */
  cancel(reason?: unknown): void;
}

interface InvokeWaiter {
  resolve: (result: InvokeResult) => void;
  reject: (error: Error) => void;
}

/** A pending state-wait / payload delivery, correlated by its echoed messageId. */
interface DoneWaiter {
  /** The Done type this id is owed (`waitForActive` → `waitForActiveDone`). */
  doneType: string;
  resolve: () => void;
  reject: (error: Error) => void;
}

/** The `{ signal }` bag every session call takes — abort is abandonment. */
interface SessionCallOptions {
  signal?: AbortSignal;
}

const appDied = (message: string, details?: Record<string, unknown>): DetoxError =>
  new DetoxError(message, { code: DetoxErrorCode.DETOX_APP_DIED, details });

export interface AppSessionInit {
  deviceId: string;
  sessionId: string;
  bundleId: string;
}

/**
 * One live (or dead — the object survives as its own tombstone) app-side
 * session. Owned by the device's gateway; an allocation's server-minted
 * `appHandleId` maps to exactly one of these, so a relaunch's fresh session
 * never answers for its dead predecessor.
 */
export class AppSession {
  readonly deviceId: string;
  /** The opaque string the app logged in with — matched, never parsed, by the core. */
  readonly sessionId: string;
  /** The driver's decoding of {@link sessionId} — what `terminate` and a resume act on. */
  readonly bundleId: string;
  /**
   * Real OS pid — assigned by the launch choreography once the spawn reported
   * it. An unsolicited login (an app launched outside Detox) has none: the
   * frozen dialect carries no process identity.
   */
  pid: number | undefined = undefined;

  /**
   * Resolves when the app itself says `ready` (the frozen sentinel), which is
   * what gates `launchApp`'s and `attach`'s resolution; rejects if the session dies first.
   */
  readonly ready: Promise<void>;

  private readonly _socket: WebSocket;
  private _readyResolve!: () => void;
  private _readyReject!: (error: Error) => void;
  private _readySettled = false;
  private _isReady = false;
  private _dead: Error | undefined;
  private _nextMessageId = FIRST_INVOKE_MESSAGE_ID;
  private readonly _inflight = new Map<number, InvokeWaiter>();
  /**
   * Pending `waitForActive` / `waitForBackground` / `deliverPayload` calls,
   * keyed by messageId (the native echoes the request's id on its Done frame
   * — `DetoxManager.swift:246-251` — so correlation is by id, unlike the
   * sentinel-ridden ready/reload lane). Shares `_nextMessageId` with the
   * invoke lane: one id space, no collisions.
   */
  private readonly _pendingDone = new Map<number, DoneWaiter>();
  /**
   * Cleanups owed to this handle's death (spec 006: a materialized payload
   * file lives as long as the handle and dies with it). Run once, from
   * `_die`, whichever path got there first; registering on an already-dead
   * session runs the hook immediately — the death already happened.
   */
  private readonly _deathHooks: Array<() => void> = [];
  /**
   * One log line per Done type per session, not one per frame: this is a
   * token-less port, and a logged-in process spamming
   * unsolicited Done frames must not become a log/disk amplifier — the
   * same reasoning as the once-per-reason refusal log, one layer in.
   */
  private readonly _loggedDroppedDones = new Set<string>();
  /**
   * Reload ledger. The frozen dialect gives `ready` no correlation id — every
   * reload frame and every ready rides the shared `-1000` sentinel — so the
   * accounting is positional: one entry per reload frame sent, in send order,
   * and each inbound `ready` settles exactly the oldest entry.
   * @issue DTX-6148: an aborted reload tombstones its entry — the owed ready is swallowed, not credited elsewhere.
   *
   * What positional accounting cannot fix — and v20 could not either — is a
   * ready the native emits spontaneously (it has three launch-time emitters,
   * `DetoxManager.swift:57-61,223,285-287`): one landing after a reload
   * registered resolves that reload early. The ledger keeps the error from
   * compounding — the stray consumes one slot, and the real ready then lands
   * on an empty queue.
   */
  private readonly _readyQueue: Array<{
    waiter?: { resolve: () => void; reject: (error: Error) => void };
  }> = [];
  /** The app's own crash report, if it managed to send one before dying. */
  private _terminationReport: Record<string, unknown> | undefined;
  /** Whether any crash report has arrived — the first-wins guard's own fact. */
  private _sawTerminationReport = false;

  constructor(socket: WebSocket, { deviceId, sessionId, bundleId }: AppSessionInit) {
    this._socket = socket;
    this.deviceId = deviceId;
    this.sessionId = sessionId;
    this.bundleId = bundleId;
    this.ready = new Promise<void>((resolve, reject) => {
      this._readyResolve = () => {
        this._readySettled = true;
        this._isReady = true;
        resolve();
      };
      this._readyReject = (error) => {
        this._readySettled = true;
        reject(error);
      };
    });
    // A launch abandoned before `ready` (abort, deadline) leaves this promise
    // to reject with nobody awaiting — that must not crash the server.
    this.ready.catch(() => undefined);
  }

  /** Dead sessions answer every action with `DETOX_APP_DIED` — permanently. */
  get dead(): boolean {
    return this._dead !== undefined;
  }

  /** Alive and the app said `ready`: attachable, and listed by `connected()`. */
  get isReady(): boolean {
    return this._isReady && this._dead === undefined;
  }

  /**
   * Relays one frozen-dialect invocation and correlates the reply by its
   * messageId. Abort is abandonment (the frozen dialect carries no
   * cancellation).
   * @issue DTX-6149: the caller is rejected, the app is sent nothing, the id is burned forever, and a late reply lands on nothing.
   */
  invoke(
    invocation: Record<string, unknown>,
    { signal }: { signal?: AbortSignal } = {},
  ): Promise<InvokeResult> {
    if (this._dead) return Promise.reject(this._deathError());
    if (signal?.aborted) return Promise.reject(new AbortError(signal.reason));

    const messageId = this._nextMessageId++;
    let resolve!: (result: InvokeResult) => void;
    let reject!: (error: Error) => void;
    const promise = new Promise<InvokeResult>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    this._inflight.set(messageId, { resolve, reject });

    const onAbort = (): void => {
      // Only reject if the reply has not already won the race; either way the
      // id stays burned — `_nextMessageId` never goes backwards.
      if (this._inflight.delete(messageId)) {
        reject(new AbortError(signal?.reason));
      }
    };
    signal?.addEventListener('abort', onAbort, { once: true });

    this._send({ type: 'invoke', messageId, params: invocation });
    return promise.finally(() => signal?.removeEventListener('abort', onAbort));
  }

  /**
   * Relays the frozen `reactNativeReload` frame and resolves on the `ready`
   * the ledger assigns to it — FIFO over reload frames sent (the native
   * reloads the RN bridge and pushes `ready` when it is back — v20
   * `actions.js:72-88`; on a non-RN app the native answers `ready` at once,
   * `DetoxManager.swift:369-372`, so the call is a fast no-op there). The
   * frame rides the frozen sentinel `-1000`, same as `ready` — why
   * correlation is positional.
   * @issue DTX-6148: abort is abandonment (uniform with {@link invoke}) — the tombstone swallows the eventual ready.
   */
  reloadReactNative({ signal }: { signal?: AbortSignal } = {}): Promise<void> {
    if (this._dead) return Promise.reject(this._deathError());
    if (signal?.aborted) return Promise.reject(new AbortError(signal.reason));

    let resolve!: () => void;
    let reject!: (error: Error) => void;
    const promise = new Promise<void>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    const entry: { waiter?: { resolve: () => void; reject: (error: Error) => void } } = {
      waiter: { resolve, reject },
    };
    this._readyQueue.push(entry);

    const onAbort = (): void => {
      if (entry.waiter) {
        entry.waiter = undefined; // tombstone: the owed ready must be swallowed
        reject(new AbortError(signal?.reason));
      }
    };
    signal?.addEventListener('abort', onAbort, { once: true });

    this._send({ type: 'reactNativeReload', messageId: READY_SENTINEL_MESSAGE_ID, params: {} });
    return promise.finally(() => signal?.removeEventListener('abort', onAbort));
  }

  /**
   * The app-state waits (spec 006): relay the frozen frame, resolve on the
   * app's own `waitForActiveDone` / `waitForBackgroundDone` — never on a
   * server guess. The server keeps no foreground/background state of its own;
   * the app's word is the only source. Abort is abandonment, uniform with
   * {@link invoke}.
   */
  waitForActive(options: SessionCallOptions = {}): Promise<void> {
    return this._doneRoundTrip('waitForActive', {}, options);
  }

  waitForBackground(options: SessionCallOptions = {}): Promise<void> {
    return this._doneRoundTrip('waitForBackground', {}, options);
  }

  /**
   * Live payload delivery (spec 006): the frozen `deliverPayload` frame,
   * params composed by the caller (the server handler materialized any value
   * to its own file first — the frame carries a server-local path, never the
   * raw value), resolved on the app's `deliverPayloadDone`.
   */
  deliverPayload(params: Record<string, unknown>, options: SessionCallOptions = {}): Promise<void> {
    return this._doneRoundTrip('deliverPayload', params, options);
  }

  /**
   * Sync settings: the frozen `setSyncSettings` frame (v20 `actions.js:240`
   * — `{enabled}` or `{blacklistURLs}`), resolved on the app's own
   * `setSyncSettingsDone`. The server keeps no sync state of its own; the
   * app's word is the only source.
   */
  setSyncSettings(params: Record<string, unknown>, options: SessionCallOptions = {}): Promise<void> {
    return this._doneRoundTrip('setSyncSettings', params, options);
  }

  /**
   * Registers a cleanup owed to this handle's death (spec 006's payload-file
   * lifetime). On an already-dead session the debt is due now, so it runs now.
   */
  onDeath(hook: () => void): void {
    if (this._dead) {
      runDeathHook(hook);
      return;
    }
    this._deathHooks.push(hook);
  }

  /** One frame out, one echoed Done frame back — the state-wait/payload lane. */
  private _doneRoundTrip(
    type: string,
    params: Record<string, unknown>,
    { signal }: SessionCallOptions,
  ): Promise<void> {
    if (this._dead) return Promise.reject(this._deathError());
    if (signal?.aborted) return Promise.reject(new AbortError(signal.reason));

    const messageId = this._nextMessageId++;
    let resolve!: () => void;
    let reject!: (error: Error) => void;
    const promise = new Promise<void>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    this._pendingDone.set(messageId, { doneType: `${type}Done`, resolve, reject });

    const onAbort = (): void => {
      // Abandonment, like invoke: the app is told nothing, the id is burned,
      // and a late Done lands on nothing.
      if (this._pendingDone.delete(messageId)) {
        reject(new AbortError(signal?.reason));
      }
    };
    signal?.addEventListener('abort', onAbort, { once: true });

    this._send({ type, messageId, params });
    return promise.finally(() => signal?.removeEventListener('abort', onAbort));
  }

  /**
   * Actively closes the session — the server terminated this app itself, and a
   * session whose app is gone must not linger (spec 003). The death is stamped
   * here, synchronously, not from the eventual close event: handle
   * invalidation must not depend on TCP close latency, and the app's own
   * socket death may race this close — "closed" is the pin, never who closed
   * first; both paths converge on the same `_die`, which is idempotent.
   */
  terminateSession(reason = 'terminated'): void {
    this._die(reason);
    this._socket.close(1000);
  }

  /** @internal — inbound frames routed here by the gateway. */
  _handleFrame(frame: FrozenFrame): void {
    switch (frame.type) {
      case 'ready':
        if (!this._readySettled) {
          serverLog.info(`[gateway] app said ready under "${this.sessionId}"`);
          this._readyResolve();
        }
        // Settles the oldest reload entry — live waiter resolved, tombstone swallowed; an empty queue means a spontaneous ready.
        this._readyQueue.shift()?.waiter?.resolve();
        return;
      case 'invokeResult': {
        const waiter = this._inflight.get(frame.messageId);
        if (!waiter) return; // A late reply to an abandoned id is dropped.
        this._inflight.delete(frame.messageId);
        waiter.resolve({ result: frame.params });
        return;
      }
      case 'testFailed': {
        const waiter = this._inflight.get(frame.messageId);
        if (!waiter) return;
        this._inflight.delete(frame.messageId);
        // The app's own payload rides `details` verbatim (details text, view hierarchy when present) — never parsed, never lost.
        waiter.reject(
          new DetoxError('The app rejected an expectation', {
            code: DetoxErrorCode.DETOX_EXPECTATION_FAILED,
            details: frame.params,
          }),
        );
        return;
      }
      case 'waitForActiveDone':
      case 'waitForBackgroundDone':
      case 'deliverPayloadDone':
      case 'setSyncSettingsDone': {
        // The state-wait / payload lane (spec 006): the native echoes the
        // request's own messageId, and the Done type must match what that id
        // is owed — a hostile process answering a state wait with someone
        // else's Done spelling must not settle it. An unsolicited or
        // mismatched Done is dropped with a log line.
        const waiter = this._pendingDone.get(frame.messageId);
        if (!waiter || waiter.doneType !== frame.type) {
          if (!this._loggedDroppedDones.has(frame.type)) {
            this._loggedDroppedDones.add(frame.type);
            serverLog.info(
              `[gateway] dropping unsolicited "${frame.type}" (messageId ${String(frame.messageId)}) from ${this.sessionId} — logged once per type`,
            );
          }
          return;
        }
        this._pendingDone.delete(frame.messageId);
        waiter.resolve();
        return;
      }
      case 'AppWillTerminateWithError':
        // The one unconsumed push that carries information nothing else can
        // reconstruct: the app's own account of why it is about to die
        // (`DetoxManager.swift:176-189`). Kept so the imminent death error
        // says why, not just "socket closed".
        //
        // @issue DTX-6152: the first crash report wins, v20-verbatim — last-wins would replace the diagnosis with the symptom.
        //
        // The guard is a flag, not `??=`: a first frame carrying no `params`
        // would leave the field nullish and let the generic second report in
        // — the very bug being fixed. v20's own guard is likewise on the
        // fact that a crash was seen, not on its payload.
        if (!this._sawTerminationReport) {
          this._sawTerminationReport = true;
          this._terminationReport = frame.params;
        }
        return;
      default:
        // Inbound tolerance: the native pushes frames this spec does not
        // consume yet (`currentStatusResult`, `waitForIdle` chatter, …).
        // Dropping them is not a protocol violation — strictness is owed only
        // to app-bound frames, where the native crashes.
        return;
    }
  }

  /** @internal — the socket closed, whoever closed it. */
  _die(reason: string): void {
    if (this._dead) return;
    this._dead = appDied(
      `The app behind this handle is gone (${reason})`,
      { sessionId: this.sessionId, bundleId: this.bundleId, deviceId: this.deviceId, pid: this.pid },
    );
    if (!this._readySettled) this._readyReject(this._deathError());
    for (const waiter of this._inflight.values()) {
      waiter.reject(this._deathError());
    }
    this._inflight.clear();
    for (const entry of this._readyQueue) {
      entry.waiter?.reject(this._deathError());
    }
    this._readyQueue.length = 0;
    for (const waiter of this._pendingDone.values()) {
      waiter.reject(this._deathError());
    }
    this._pendingDone.clear();
    for (const hook of this._deathHooks.splice(0)) {
      runDeathHook(hook);
    }
  }

  /** A fresh error per rejection, so no two callers share one stack. */
  private _deathError(): DetoxError {
    const dead = this._dead;
    return appDied(dead?.message ?? 'The app behind this handle is gone', {
      sessionId: this.sessionId,
      bundleId: this.bundleId,
      deviceId: this.deviceId,
      pid: this.pid,
      ...(this._terminationReport ? { appReport: this._terminationReport } : {}),
    });
  }

  private _send(frame: FrozenFrame): void {
    // Text, as v20's server always sent — binary is only what the native sends and the gateway accepts.
    this._socket.send(JSON.stringify(frame));
  }
}

/** A death hook must not turn a session's death into a server crash. */
function runDeathHook(hook: () => void): void {
  try {
    hook();
  } catch (err) {
    serverLog.error(`[gateway] a session death cleanup threw; ignoring it: ${describeError(err)}`);
  }
}

interface LoginExpectation {
  resolve: (session: AppSession) => void;
  reject: (error: Error) => void;
  settled: boolean;
}

interface ReadyWaiter {
  resolve: (session: AppSession) => void;
  reject: (error: Error) => void;
  /** Detaches the abort listener; called on every settlement. */
  cleanup: () => void;
}

/**
 * The per-device listener. Sessions are keyed by the session-id string the
 * app logged in with (the bundle id by default — the frozen natives' own
 * fallback, `DetoxManager.swift:127`, `DetoxServerInfo.kt:11`); routing is
 * by socket forever after the login.
 */
export class AppGateway {
  private readonly _wss: WebSocketServer;
  private readonly _host: string;
  private readonly _deviceId: string;
  private readonly _decodeBundleId: (sessionId: string) => string;
  private readonly _loginDeadlineMs: number;
  private readonly _closeGraceMs: number;
  /** The live session per session id — a new login under a live id supersedes (the one rule). */
  private readonly _live = new Map<string, AppSession>();
  /** Every session that ever logged in and has not been closed yet — the close sweep's view. */
  private readonly _sessions = new Set<AppSession>();
  /** Launch claims: the next login under an id (registered before the spawn, so the app never connects into a void). */
  private readonly _expected = new Map<string, Set<LoginExpectation>>();
  /** Attach waiters: the next session to become ready under an id. */
  private readonly _readyWaiters = new Map<string, Set<ReadyWaiter>>();
  /** Hooks run on every accepted login (the iOS driver clears its `cleanBoot` here). */
  private readonly _loginHooks: Array<(session: AppSession) => void> = [];
  /** One log line per distinct refusal, not one per redial: the frozen native reconnects every second, forever. */
  private readonly _loggedRefusals = new Set<string>();
  private _closed = false;

  private constructor(wss: WebSocketServer, options: Required<Omit<AppGatewayOptions, 'preferredPort'>>) {
    this._wss = wss;
    this._host = options.host;
    this._deviceId = options.deviceId;
    this._decodeBundleId = options.decodeBundleId;
    this._loginDeadlineMs = options.loginDeadlineMs;
    this._closeGraceMs = options.closeGraceMs;
    wss.on('connection', (socket, request) => this._accept(socket, request));
  }

  /**
   * Binds and resolves once listening. The preferred port is tried first and
   * yielded to whoever holds it (any listen error on it falls back to an
   * ephemeral port); without one the port is ephemeral from the start.
   */
  static async listen({
    host = '127.0.0.1',
    preferredPort,
    deviceId = '',
    decodeBundleId = (sessionId: string): string => sessionId,
    loginDeadlineMs = LOGIN_DEADLINE_MS,
    closeGraceMs = CLOSE_GRACE_MS,
  }: AppGatewayOptions = {}): Promise<AppGateway> {
    let wss: WebSocketServer;
    if (preferredPort !== undefined) {
      try {
        wss = await bind(host, preferredPort);
      } catch {
        wss = await bind(host, 0);
      }
    } else {
      wss = await bind(host, 0);
    }
    return new AppGateway(wss, { host, deviceId, decodeBundleId, loginDeadlineMs, closeGraceMs });
  }

  /** The listener address, dialable verbatim — what a manual launch must be handed (`apps.serverUrl`). */
  get url(): string {
    const address = this._wss.address();
    const port = typeof address === 'object' && address ? address.port : 0;
    const authority = this._host.includes(':') ? `[${this._host}]` : this._host;
    return `ws://${authority}:${String(port)}`;
  }

  /** The live session under `sessionId`, ready or not; `undefined` when none is connected. */
  live(sessionId: string): AppSession | undefined {
    return this._live.get(sessionId);
  }

  /** The device's ready sessions — what `connected()` lists and `attach` resolves to at once. */
  connected(): AppSession[] {
    return [...this._live.values()].filter((session) => session.isReady);
  }

  /** Every live session, ready or not — the legacy terminate-by-bundle-id sweep's view. */
  allLive(): AppSession[] {
    return [...this._live.values()];
  }

  /**
   * Registers a launch's claim on the NEXT login under `sessionId`.
   * Registered before the spawn, so the app can never connect into a void —
   * whichever of "launch returned" and "app dialed in" happens first, the
   * claim is already waiting.
   */
  expectLogin(sessionId: string): PendingApp {
    let resolve!: (session: AppSession) => void;
    let reject!: (error: Error) => void;
    const promise = new Promise<AppSession>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    const expectation: LoginExpectation = { resolve, reject, settled: false };
    const set = this._expected.get(sessionId) ?? new Set<LoginExpectation>();
    set.add(expectation);
    this._expected.set(sessionId, set);
    // Same guard as AppSession.ready: a cancelled claim must not crash the
    // process just because its launch already stopped listening.
    promise.catch(() => undefined);
    return {
      session: promise,
      cancel: (reason?: unknown): void => {
        set.delete(expectation);
        if (set.size === 0) this._expected.delete(sessionId);
        if (!expectation.settled) {
          expectation.settled = true;
          reject(
            reason instanceof Error
              ? reason
              : appDied('launch abandoned before the app connected', { sessionId }),
          );
        }
      },
    };
  }

  /**
   * `attach`'s wait: resolves with a session connected AND ready under
   * `sessionId` — at once if one already is, otherwise with the next one to
   * get there. A login that dies before `ready` leaves the waiter waiting.
   * Never spawns. Abort rejects `DETOX_ABORTED`.
   */
  waitForReady(sessionId: string, { signal }: SessionCallOptions = {}): Promise<AppSession> {
    const now = this._live.get(sessionId);
    if (now?.isReady) return Promise.resolve(now);
    if (signal?.aborted) return Promise.reject(new AbortError(signal.reason));
    if (this._closed) return Promise.reject(appDied('the app gateway is closed', { sessionId }));
    return new Promise<AppSession>((resolve, reject) => {
      const set = this._readyWaiters.get(sessionId) ?? new Set<ReadyWaiter>();
      const waiter: ReadyWaiter = {
        resolve,
        reject,
        cleanup: () => {
          signal?.removeEventListener('abort', onAbort);
          set.delete(waiter);
          if (set.size === 0 && this._readyWaiters.get(sessionId) === set) this._readyWaiters.delete(sessionId);
        },
      };
      const onAbort = (): void => {
        waiter.cleanup();
        reject(new AbortError(signal?.reason));
      };
      signal?.addEventListener('abort', onAbort, { once: true });
      set.add(waiter);
      this._readyWaiters.set(sessionId, set);
    });
  }

  /**
   * `launch`'s first step: the live session under the id is tombstoned
   * (`DETOX_APP_DIED`, superseded) and its socket closed, before the process
   * is killed and the fresh one spawned. Returns what it tombstoned, if anything.
   */
  supersede(sessionId: string, reason = 'superseded by a relaunch'): AppSession | undefined {
    const old = this._live.get(sessionId);
    if (!old) return undefined;
    this._live.delete(sessionId);
    old.terminateSession(reason);
    return old;
  }

  /** Runs `hook` on every accepted login — the driver's seam for "something is running now". */
  onLogin(hook: (session: AppSession) => void): void {
    this._loginHooks.push(hook);
  }

  /** Closes every session and socket (politely, then not) and stops listening. */
  async close(): Promise<void> {
    this._closed = true;
    for (const session of this._sessions) session.terminateSession('the app gateway is closing');
    this._live.clear();
    for (const [sessionId, set] of this._expected) {
      for (const expectation of set) {
        if (!expectation.settled) {
          expectation.settled = true;
          expectation.reject(appDied('the app gateway is shutting down', { sessionId }));
        }
      }
    }
    this._expected.clear();
    for (const [sessionId, set] of [...this._readyWaiters]) {
      for (const waiter of [...set]) {
        waiter.cleanup();
        waiter.reject(appDied('the app gateway is shutting down', { sessionId }));
      }
    }
    this._readyWaiters.clear();
    const closed = new Promise<void>((resolve, reject) => {
      this._wss.close((err) => (err ? reject(err) : resolve()));
    });
    // `wss.close()` alone waits for every client forever — a pre-login socket that never says anything would hold shutdown open.
    for (const client of this._wss.clients) {
      client.close(1001);
    }
    const hardKill = setTimeout(() => {
      for (const client of this._wss.clients) client.terminate();
    }, this._closeGraceMs);
    hardKill.unref();
    await closed.finally(() => clearTimeout(hardKill));
  }

  private _accept(socket: WebSocket, _request: IncomingMessage): void {
    let session: AppSession | undefined;

    // Anything real logs in from its socket-open callback; an unreaped
    // silent socket is a standing grip on this server's shutdown.
    const loginDeadline = setTimeout(() => {
      if (!session) socket.terminate();
    }, this._loginDeadlineMs);
    loginDeadline.unref();

    socket.on('message', (data: RawData) => {
      let frame: FrozenFrame;
      try {
        frame = parseFrame(data);
      } catch (err) {
        // A peer that cannot speak the dialect is not an app; hang up. An
        // existing session dies through this same close path, like any
        // other loss.
        serverLog.error(`[gateway] dropping connection on malformed frame: ${describeError(err)}`);
        socket.close(1008);
        return;
      }
      if (session) {
        session._handleFrame(frame);
        return;
      }
      session = this._login(socket, frame);
      if (session) clearTimeout(loginDeadline);
      else socket.close(1008);
    });

    socket.on('close', () => {
      clearTimeout(loginDeadline);
      if (session) {
        session._die('socket closed');
        this._sessions.delete(session);
        // A crash frees the id the moment the socket closes — unless a newer
        // login already took it over.
        if (this._live.get(session.sessionId) === session) this._live.delete(session.sessionId);
      }
    });
    socket.on('error', ignoreSocketError);
  }

  /** Logs a refusal once per distinct reason — never once per redial. */
  private _refuse(key: string, message: string): undefined {
    if (!this._loggedRefusals.has(key)) {
      this._loggedRefusals.add(key);
      serverLog.error(message);
    }
    return undefined;
  }

  /**
   * The first frame must be a well-formed `login` (role `app`, a string
   * session id — the dialect checks stay) or the connection is turned away.
   * Any well-formed one is accepted: whoever dials this listener is on this
   * device, and the id says which app.
   */
  private _login(socket: WebSocket, frame: FrozenFrame): AppSession | undefined {
    if (frame.type !== 'login') {
      return this._refuse(
        `frame:${frame.type}`,
        `[gateway] first frame was "${frame.type}", not login — closing`,
      );
    }
    const params = frame.params ?? {};
    const sessionId = typeof params.sessionId === 'string' ? params.sessionId : undefined;
    const role = params.role;
    if (!sessionId || role !== 'app') {
      return this._refuse('login:no-role', '[gateway] login without app role/session id — closing');
    }
    if (this._closed) {
      return this._refuse('closed', '[gateway] login after close — closing');
    }
    // A raw login under an id whose session is still alive is turned away: the
    // live session keeps the id until its own socket closes (a crash frees it).
    // Superseding a live app is `launch`'s job — it tombstones the old session
    // explicitly (`supersede`) before spawning, so the spawn's login is never a
    // duplicate. Refusing here (rather than superseding) also keeps a second,
    // incidental connection to the same app — an injected framework alongside a
    // test's own testee — from killing the first, whichever raced ahead.
    const live = this._live.get(sessionId);
    if (live && !live.dead) {
      return this._refuse(
        `dup:${sessionId}`,
        `[gateway] a session is already live under "${sessionId}" — turning away the duplicate login`,
      );
    }
    const session = new AppSession(socket, {
      deviceId: this._deviceId,
      sessionId,
      bundleId: this._decodeBundleId(sessionId),
    });
    this._sessions.add(session);
    this._live.set(sessionId, session);
    // Native parity, in order — login answered echoing its own messageId, then readiness probed once with the frozen sentinel.
    // The app answers `ready` iff ready and also pushes it spontaneously
    // when it gets there (`DetoxManager.swift:111-113,285-289`) — either
    // arrival resolves the launch. The probe is load-bearing for an app that
    // dialed before the listener existed: its `ready` went out on the socket
    // task that failed, and the redial (`DetoxManager.swift:228-232`)
    // carries none of its own.
    serverLog.info(
      `[gateway] login accepted for "${sessionId}" — answering loginSuccess and probing isReady`,
    );
    socket.send(JSON.stringify({ type: 'loginSuccess', messageId: frame.messageId, params: {} }));
    socket.send(
      JSON.stringify({ type: 'isReady', messageId: READY_SENTINEL_MESSAGE_ID, params: {} }),
    );
    const expectations = this._expected.get(sessionId);
    if (expectations) {
      this._expected.delete(sessionId);
      for (const expectation of expectations) {
        if (!expectation.settled) {
          expectation.settled = true;
          expectation.resolve(session);
        }
      }
    }
    // Attachable on the app's own `ready` — and only if it is still the live
    // session under the id by then.
    void session.ready.then(
      () => {
        if (this._live.get(sessionId) !== session) return;
        const waiters = this._readyWaiters.get(sessionId);
        if (!waiters) return;
        for (const waiter of [...waiters]) {
          waiter.cleanup();
          waiter.resolve(session);
        }
      },
      () => undefined,
    );
    for (const hook of this._loginHooks) {
      try {
        hook(session);
      } catch (err) {
        serverLog.error(`[gateway] a login hook threw; ignoring it: ${describeError(err)}`);
      }
    }
    return session;
  }
}

/** Binds one listener and resolves once listening, or rejects with the bind error. */
function bind(host: string, port: number): Promise<WebSocketServer> {
  return new Promise<WebSocketServer>((resolve, reject) => {
    const wss = new WebSocketServer({ host, port, maxPayload: MAX_FRAME_BYTES });
    const onError = (err: Error): void => {
      wss.removeListener('listening', onListening);
      // A server that never listened has nothing to release, but `close` with
      // a callback keeps the "was never listening" complaint out of the event stream.
      wss.close(() => undefined);
      reject(err);
    };
    const onListening = (): void => {
      wss.removeListener('error', onError);
      resolve(wss);
    };
    wss.once('listening', onListening);
    wss.once('error', onError);
  });
}

/**
 * The mandatory `'error'` sink: a `ws` socket error with no listener crashes
 * the process. The paired `'close'` event carries the observable outcome.
 *
 * @internal Exported only for the coverage tripwire: a loopback client cannot
 * make the server-side socket emit `'error'` on demand (even an RST surfaces
 * as bare `'close'`), so the sink is exercised directly.
 */
export const ignoreSocketError = (): void => undefined;

const parseFrame = (data: RawData): FrozenFrame => {
  const raw = rawDataToString(data);
  // JSON.parse tolerates trailing whitespace (RFC 8259), which covers Detox
  // 20's `'\n '` suffix without demanding it.
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error(`non-object frame: ${raw}`);
  }
  const frame = parsed as Partial<FrozenFrame>;
  if (typeof frame.type !== 'string' || frame.type.length === 0) {
    throw new Error(`frame without a string "type": ${raw}`);
  }
  if (typeof frame.messageId !== 'number') {
    throw new Error(`"${frame.type}" frame without a numeric messageId: ${raw}`);
  }
  return frame as FrozenFrame;
};

const rawDataToString = (data: RawData): string => {
  if (Array.isArray(data)) return Buffer.concat(data).toString('utf8');
  if (data instanceof ArrayBuffer) return Buffer.from(data).toString('utf8');
  return data.toString('utf8');
};
