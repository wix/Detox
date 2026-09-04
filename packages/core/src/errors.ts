import type { CancelOutcome } from './peer/undo-stack';

/**
 * The Detox error-code vocabulary — spec 004, the error taxonomy.
 *
 * The errno model: a stable class `name` reads, this number identifies. Server
 * failures carry the number as the JSON-RPC `error.code` and their structured
 * payload as `error.data`; `message` is human prose and is never parsed.
 *
 * It lives in core, not in `detox`, because the *server* stamps these numbers
 * and cannot import the client package. `detox/client` re-exports it, which
 * is the public surface.
 *
 * Range: 2000–2099. Negative codes belong to JSON-RPC (-32768…-32000, plus
 * LSP's -32800 which this transport also uses for cancellation), and 1000–1015
 * / 3000–4999 are WebSocket close codes — which appear on the *same* error
 * objects as `details.closeCode`, so overlapping them would put two unrelated
 * four-digit numbers side by side. 2000-something is unclaimed by both.
 *
 * Adding a code is additive and needs no client release: a client with no class
 * for a number surfaces it as base `DetoxError` with `code` and `details`
 * intact. Append here; this is the only registry.
 */
export const DetoxErrorCode = {
  /** No slot free: every matching device is held, or the pool cap is reached. */
  DETOX_POOL_EXHAUSTED: 2001,
  /** Nothing on this host can ever satisfy the query. Terminal, always. */
  DETOX_NO_MATCHING_DEVICE: 2002,
  /** The caller, or its session, cancelled the operation. */
  DETOX_ABORTED: 2003,
  /** Nobody answered at the dial target. */
  DETOX_SERVER_UNREACHABLE: 2004,
  /** The server answered, and refused the bearer token. */
  DETOX_UNAUTHORIZED: 2005,
  /** An established connection dropped mid-session. */
  DETOX_CONNECTION_LOST: 2006,
  /** The server ended the session itself — keepalive, close code 4001.
   * The close code is a detail, never a second axis. */
  DETOX_SESSION_EXPIRED: 2007,
  /** The handle is not one this session holds — already released, its device
   *  gone, or an id this session never issued (a foreign session's live id
   *  gets the same answer: revealing "exists, but not yours" would leak the
   *  fleet's shape). */
  DETOX_STALE_HANDLE: 2008,
  /** The server broke its own protocol (`-32601`, malformed frames) — the
   *  "report an issue" family, never the caller's fault. */
  DETOX_INTERNAL: 2009,
  /** A public entry point a spec has not wired up yet. */
  DETOX_NOT_IMPLEMENTED: 2010,
  /**
   * The request carried a parameter the server refuses to act on: a required
   * value that was missing, or one whose shape could change the meaning of
   * the command line it lands in (an argument that looks like a flag).
   * Always the caller's fault, always terminal, never a silent no-op.
   */
  DETOX_INVALID_ARGUMENT: 2011,
  /**
   * The server's own deadline had to kill an operation on this device, so
   * what the device *is* right now is unknown. The device leaves its
   * allocation and is excluded from new picks while unknown; nothing is
   * written to disk, so a restart clears it. Automatic probe-based recovery
   * is not implemented.
   */
  DETOX_DEVICE_UNKNOWN_STATE: 2012,
  /**
   * The app behind this handle is gone — its gateway connection died (crash,
   * kill, socket loss), it was terminated, or a launch never completed its
   * handshake. Handle-scoped and permanent: the handle stays dead, the DEVICE
   * allocation is untouched, and a fresh `launchApp` supersedes rather than
   * revives (spec 003).
   */
  DETOX_APP_DIED: 2013,
  /**
   * The app answered `testFailed`: an expectation was not met. The app's own
   * failure payload (details text, view hierarchy when present) rides in
   * `details` — preserved verbatim, never parsed (spec 004 forbids routing on
   * prose; spec 003 forbids losing it).
   */
  DETOX_EXPECTATION_FAILED: 2014,
  /**
   * A call arrived before the surface it belongs to was initialized — e.g. a
   * `detox-compat` global (`device`, `element`) used before `connect()`, or
   * after `cleanup()`. Caller-order misuse, not a server condition: the
   * server never stamps this code.
   */
  DETOX_NOT_INITIALIZED: 2015,
  /**
   * A URL-form `installApp` could not turn its link into an installed app:
   * the download failed (HTTP status, network, size cap), the archive would
   * not unpack, or the unpacked tree did not hold exactly one `.app` bundle.
   * The URL's shape being wrong (unsupported scheme/extension) is the
   * caller's mistake and stays `DETOX_INVALID_ARGUMENT`; this code means the
   * link was well-formed and the transfer itself came apart (spec 003).
   */
  DETOX_APP_TRANSFER_FAILED: 2016,
  /**
   * The counterpart speaks a different wire protocol: the server's
   * `$/serverInfo` announce named a `protocol` this client does not speak,
   * and the client closed rather than exchange frames whose meaning neither
   * side can vouch for. The message names both versions and the fix
   * (restart/upgrade the `detox server`); connection-family (`.name ===
   * 'DetoxConnectionError'`) because the session is over either way.
   */
  DETOX_VERSION_SKEW: 2017,
  /**
   * A server refused to start because another live server holds the log
   * root (spec 012: one server per root, kernel-enforced by a UNIX socket
   * under it). The message names the root; stop the other server or point
   * this one at a different log root.
   */
  DETOX_LOG_ROOT_HELD: 2018,
  /**
   * The endpoint completed the WebSocket handshake and then never sent
   * `$/serverInfo`, the first frame every Detox 21 server (and relay) sends
   * the instant it accepts a connection. Either the address points at
   * something that is not a Detox 21 server, or the announce was lost on the
   * way; the message names the address and the ceiling that expired.
   * Connection-family: the socket is closed before this is thrown. Never
   * stamped by a server — the client is the only side that can see silence.
   */
  DETOX_SERVER_DID_NOT_ANNOUNCE: 2019,
  /**
   * A failure that reached the caller without a Detox code of its own: a
   * server throw that nobody has classified yet (`-32000` with no `data`).
   * Last in the range: every entry that gets classified moves out of it
   * into a code of its own.
   */
  DETOX_UNCLASSIFIED: 2099,
} as const;

/** Any allocated Detox error code. */
export type DetoxErrorCode = (typeof DetoxErrorCode)[keyof typeof DetoxErrorCode];

/** What every `DetoxError` constructor takes beyond its message. */
export interface DetoxErrorOptions {
  /** Structured payload — the API a caller programs against, never prose. */
  readonly details?: Record<string, unknown>;
  readonly cause?: unknown;
}

/** What the base constructor takes — every subclass fixes `code` itself. */
export interface DetoxErrorInit extends DetoxErrorOptions {
  readonly code: number;
}

/**
 * Base of the whole hierarchy (spec 004). `.name` is the coarse signal that
 * survives a reporter's serialization; `.code` is the fine one in-process
 * code branches on. Every subclass sets its own `.name`; a code with no
 * subclass of its own rides this base directly — see {@link errorFromWire}.
 */
export class DetoxError extends Error {
  readonly code: number;
  readonly details?: Record<string, unknown>;

  constructor(message: string, init: DetoxErrorInit) {
    super(message, init.cause !== undefined ? { cause: init.cause } : undefined);
    this.name = 'DetoxError';
    this.code = init.code;
    this.details = init.details;
  }
}

/** The two things a cancelled operation may know beyond its reason. */
export interface AbortErrorDetails {
  /** The rejection this abort displaced, if the underlying call failed on its own. */
  readonly displaced?: unknown;
  /**
   * What the remote side said about the work this cancellation raced. It
   * arrives on the `-32800` answer when the cancellation caught the handler
   * running, or on a `$/cancelAck` when the answer had already gone out —
   * same vocabulary either way. Absent when nobody said anything: see the
   * class doc.
   *
   * The union is open: an unrecognised word passes through rather than being
   * swallowed, so a `switch` over this field needs a default arm.
   */
  readonly outcome?: CancelOutcome;
}

/**
 * Rejection carried by every cancelled operation. `.cause` is pinned to the
 * abort reason — accept-001 and accept-004 freeze that identity, so it is
 * never available for anything else. A rejection an abort *displaced* (the
 * underlying call failed for its own reason right as the abort landed) rides
 * `details.displaced` instead of `reason.cause`: `reason` is caller-owned
 * and, per `AbortSignal.any`, often shared across every operation a session
 * started, so mutating it risks a `TypeError` on a frozen reason or one
 * operation reporting another's failure. `details` is this class's own slot:
 * nothing shared, nothing mutated.
 *
 * `details.outcome` is the second occupant of that slot: what the remote side
 * reported about the work the cancellation raced (`undone`, `nothing-to-undo`,
 * `undo-failed`, or `unknown`).
 *
 * An absent `outcome` promises nothing. It is what a rejection carries
 * whenever no acknowledgment was involved at all: an already-aborted signal
 * that never reached the wire, an abort during connect, or a plain failure
 * that raced the abort and settled the call without ever speaking about
 * cleanup. Reading absence as "it was cleaned up" is a guess. Only a present
 * `outcome` is a statement, and `unknown` states explicitly that nobody
 * knows.
 *
 * A `-32800` answer does carry one: it is sent after the handler stopped and
 * its rollback ran, and says how that rollback went.
 */
export class AbortError extends DetoxError {
  constructor(reason?: unknown, details?: AbortErrorDetails) {
    const own: Record<string, unknown> = {};
    if (details?.displaced !== undefined) own.displaced = details.displaced;
    if (details?.outcome !== undefined) own.outcome = details.outcome;
    super('Aborted', {
      code: DetoxErrorCode.DETOX_ABORTED,
      cause: reason,
      details: Object.keys(own).length > 0 ? own : undefined,
    });
    this.name = 'AbortError';
  }
}

/** What `DetoxConnectionError` needs beyond its message — `code` varies across the family it covers. */
export interface DetoxConnectionErrorInit extends DetoxErrorOptions {
  readonly code: DetoxErrorCode;
}

/**
 * The connection to the Detox Server could not be established or was lost.
 * Covers a family of codes — `DETOX_SERVER_UNREACHABLE`, `DETOX_UNAUTHORIZED`,
 * `DETOX_CONNECTION_LOST`, `DETOX_SESSION_EXPIRED` — because `.name` is the
 * coarse signal a serialized reporter still sees; `.code` is the fine one.
 */
export class DetoxConnectionError extends DetoxError {
  constructor(message: string, init: DetoxConnectionErrorInit) {
    super(message, init);
    this.name = 'DetoxConnectionError';
  }
}

/** No slot free — see `DetoxErrorCode.DETOX_POOL_EXHAUSTED`. */
export class DevicePoolExhaustedError extends DetoxError {
  constructor(message: string, options?: DetoxErrorOptions) {
    super(message, { ...options, code: DetoxErrorCode.DETOX_POOL_EXHAUSTED });
    this.name = 'DevicePoolExhaustedError';
  }
}

/** Nothing on this host can ever satisfy the query — see `DETOX_NO_MATCHING_DEVICE`. */
export class NoMatchingDeviceError extends DetoxError {
  constructor(message: string, options?: DetoxErrorOptions) {
    super(message, { ...options, code: DetoxErrorCode.DETOX_NO_MATCHING_DEVICE });
    this.name = 'NoMatchingDeviceError';
  }
}

/**
 * The device's state is unknown after the server killed a wedged operation on
 * it — see `DETOX_DEVICE_UNKNOWN_STATE`. A class of its own because this is
 * the one failure in the utilities family where the *device*, not the call, is
 * the casualty: the handle is dead from here on, and a caller that wants to
 * retry must allocate again rather than re-issue.
 */
export class DeviceUnknownStateError extends DetoxError {
  constructor(message: string, options?: DetoxErrorOptions) {
    super(message, { ...options, code: DetoxErrorCode.DETOX_DEVICE_UNKNOWN_STATE });
    this.name = 'DeviceUnknownStateError';
  }
}

/** Builds a class instance from a wire `(message, options)` pair — every code with a class registers one. */
type ErrorFactory = (message: string, options?: DetoxErrorOptions) => DetoxError;

function connectionErrorFactory(code: DetoxErrorCode): ErrorFactory {
  return (message, options) => new DetoxConnectionError(message, { ...options, code });
}

/**
 * Every code that has a class of its own; every other code rides `DetoxError`
 * base. Factories, not bare constructors: `DetoxConnectionError` needs its
 * `code` threaded through (one class, four codes), and `AbortError` takes a
 * `reason` rather than a `(message, options)` pair — wire-side, an aborted
 * call is always intercepted before reaching here (see `errorFromWire`'s
 * `-32800` branch), so its factory exists for completeness, not a reachable
 * path.
 */
const ERROR_CLASSES: Partial<Record<DetoxErrorCode, ErrorFactory>> = {
  [DetoxErrorCode.DETOX_POOL_EXHAUSTED]: (message, options) => new DevicePoolExhaustedError(message, options),
  [DetoxErrorCode.DETOX_NO_MATCHING_DEVICE]: (message, options) => new NoMatchingDeviceError(message, options),
  // @issue DTX-1013: `details` is threaded through — `AbortError` owns the rollback outcome.
  [DetoxErrorCode.DETOX_ABORTED]: (message, options) => new AbortError(options?.cause, options?.details),
  [DetoxErrorCode.DETOX_SERVER_UNREACHABLE]: connectionErrorFactory(DetoxErrorCode.DETOX_SERVER_UNREACHABLE),
  [DetoxErrorCode.DETOX_UNAUTHORIZED]: connectionErrorFactory(DetoxErrorCode.DETOX_UNAUTHORIZED),
  [DetoxErrorCode.DETOX_CONNECTION_LOST]: connectionErrorFactory(DetoxErrorCode.DETOX_CONNECTION_LOST),
  [DetoxErrorCode.DETOX_SESSION_EXPIRED]: connectionErrorFactory(DetoxErrorCode.DETOX_SESSION_EXPIRED),
  [DetoxErrorCode.DETOX_VERSION_SKEW]: connectionErrorFactory(DetoxErrorCode.DETOX_VERSION_SKEW),
  [DetoxErrorCode.DETOX_SERVER_DID_NOT_ANNOUNCE]: connectionErrorFactory(DetoxErrorCode.DETOX_SERVER_DID_NOT_ANNOUNCE),
  [DetoxErrorCode.DETOX_DEVICE_UNKNOWN_STATE]: (message, options) => new DeviceUnknownStateError(message, options),
};

/** JSON-RPC's own codes that predate and coexist with ours (range discipline, above). */
const JSONRPC_METHOD_NOT_FOUND = -32601;
const JSONRPC_CANCELLED = -32800;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Builds the error a caller sees from a JSON-RPC response's `error` field.
 * Never inspects `message` to decide anything — `code` is the only signal:
 * a Detox code (2000-2099) gets its class, or rides base `DetoxError` if no
 * class claims it yet. `-32601`/`-32800` fold into the codes their own doc
 * comments already claim (`details.jsonRpcCode` preserves the original for
 * the ones that land on base `DetoxError`); everything else — every
 * unclassified handler throw — becomes `DETOX_UNCLASSIFIED`. In practice
 * `-32800` never reaches here: `Peer._handleResponse` intercepts it via
 * `pending.aborted` first — this mapping exists for the fake-peer /
 * version-skew case, same as the rest.
 */
export function errorFromWire(code: number, message: string, data?: unknown): DetoxError {
  const details = isRecord(data) ? data : undefined;
  const mappedCode =
    code >= 2000 && code <= 2099
      ? code
      : code === JSONRPC_METHOD_NOT_FOUND
        ? DetoxErrorCode.DETOX_INTERNAL
        : code === JSONRPC_CANCELLED
          ? DetoxErrorCode.DETOX_ABORTED
          : DetoxErrorCode.DETOX_UNCLASSIFIED;
  const wireDetails = mappedCode === code ? details : { ...details, jsonRpcCode: code };
  const factory = ERROR_CLASSES[mappedCode as DetoxErrorCode];
  return factory
    ? factory(message, { details: wireDetails })
    : new DetoxError(message, { code: mappedCode, details: wireDetails });
}

/** What `toWireError` builds — the JSON-RPC `error` field of a response. */
export interface WireError {
  readonly code: number;
  readonly message: string;
  readonly data?: unknown;
}

/**
 * Builds the JSON-RPC `error` field from a handler throw — the wire-framing
 * half of {@link errorFromWire}. A `DetoxError` puts its own code directly on
 * the wire (2000-2099, never wrapped in `-32000`); anything else is an
 * unclassified handler throw and keeps the JSON-RPC generic fallback.
 */
export function toWireError(err: unknown): WireError {
  if (err instanceof DetoxError) {
    return { code: err.code, message: err.message, data: err.details };
  }
  return { code: -32000, message: err instanceof Error ? err.message : String(err) };
}
