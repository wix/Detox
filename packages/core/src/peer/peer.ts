import type { Channel, CloseInfo, ErrorHandler } from '../channel';
import type { RpcMessage, RpcNotification, RpcRequest, RpcResponse } from './rpc-types';
import { isRpcRequest, isRpcResponse, isRpcNotification } from './rpc-types';
import {
  isCancelAckNotification,
  isCancelRequestNotification,
  isProgressNotification,
} from './system-notifications';
import { UndoStack, readOutcome } from './undo-stack';
import type { CancelOutcome } from './undo-stack';
import type {
  RequestHandler,
  NotifyHandler,
  RequestCallOpts,
  NotifyOpts,
  OnRequestOpts,
  OnNotifyOpts,
  CallOptions,
} from './request-context';
import { AbortError, DetoxConnectionError, DetoxErrorCode, errorFromWire, toWireError } from '../errors';
import type { WireError } from '../errors';

interface PendingCall {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  onProgress?: (value: unknown) => void;
  /**
   * Set once the caller aborted. Any late *error* response then settles as an
   * AbortError; a late *successful* one is withheld until `$/cancelAck` says
   * what became of the result nobody is going to take (see `_handleResponse`).
   */
  abortReason?: unknown;
  aborted?: boolean;
}

/** An answered request id, kept around only long enough to lose a race gracefully. */
interface RetainedRequest {
  undo: UndoStack;
  expiresAt: number;
  /** The request as observed, so a late rollback runs inside the same scope its handler did. */
  begin: ObservedRequestBegin;
}

/**
 * How long the responder remembers a request it already answered, so a
 * cancellation that lost the race with the response still finds a rollback to
 * run and something to acknowledge.
 *
 * Sized by how long a device can still be handed back, not by anyone's
 * patience — the requester keeps no clock of its own (see `request`).
 * Memory is bounded by {@link RETAIN_MAX}, not by this number: the ceiling is
 * the guard, the clock is only how long the responder stays useful.
 */
const RETAIN_MS = 60_000;

/** JSON-RPC's own "request cancelled" code — the frame that carries the outcome. */
const JSONRPC_CANCELLED = -32800;

/** What a cancellation answer said about its rollback, ready for `AbortError`'s `details`. */
interface ReportedOutcome {
  outcome: CancelOutcome;
}

/** The `data` shape `outcomeOf` reads out of a `-32800` answer, before it is trusted. */
interface CancelledData {
  outcome?: unknown;
}

/**
 * The rollback outcome an error response carries, if it is the cancellation
 * answer and it says anything at all. The word itself is vetted by
 * {@link readOutcome} — the same reader the `$/cancelAck` path uses, because
 * one field with two validators is one field with two meanings.
 */
function outcomeOf(error: RpcResponse['error']): ReportedOutcome | undefined {
  if (error?.code !== JSONRPC_CANCELLED) return undefined;
  const data = error.data;
  if (typeof data !== 'object' || data === null) return undefined;
  const outcome = readOutcome((data as CancelledData).outcome);
  return outcome === undefined ? undefined : { outcome };
}

/** The `-32800` answer, carrying what the rollback did. */
function cancelledError(outcome: CancelOutcome): WireError {
  return { code: JSONRPC_CANCELLED, message: 'Request cancelled', data: { outcome } };
}

/** @issue DTX-1012: the ceiling — retained records are dropped oldest-first once it is full. */
const RETAIN_MAX = 4096;

/** What {@link PeerObserver.onRequestBegin} sees: the request as it starts running. */
export interface ObservedRequestBegin {
  /** The wire id of the request — the only correlation key across begin/progress/end. */
  readonly id: string;
  readonly method: string;
  readonly params: unknown;
  /**
   * The handler's own signal — the same object the handler receives as
   * `ctx.signal`, so an observer can recognise the request again from
   * inside anything the handler passes it to.
   */
  readonly signal: AbortSignal;
  /** The frame's `step` member as it arrived (spec 013), unjudged — the observer decides what it names. */
  readonly step?: unknown;
}

/**
 * Runs one handled request inside a scope of the embedder's choosing (spec
 * 013): the server wraps every handler in an `AsyncLocalStorage` context
 * naming the request, so anything the handler reaches — a child process
 * spawn three modules down — can find the request it serves without the
 * request being threaded through every signature. The peer itself puts
 * nothing in the scope; it only guarantees the handler runs inside `run`.
 */
export type HandlerScope = <T>(info: ObservedRequestBegin, run: () => Promise<T>) => Promise<T>;

export interface PeerOptions {
  handlerScope?: HandlerScope;
}

/** What {@link PeerObserver.onProgress} sees: one `$/progress` value, before any wire mute. */
export interface ObservedProgress {
  readonly id: string;
  readonly value: unknown;
}

/** What {@link PeerObserver.onRequestEnd} sees: the request has settled, whatever the wire said. */
export interface ObservedRequestEnd {
  readonly id: string;
  readonly method: string;
  readonly ok: boolean;
  /** The JSON-RPC `error` object the wire carries (or would have, on a closed channel). */
  readonly error?: WireError;
  /** The handler's result as sent (spec 012: the recorder summarizes the result a handler minted). Absent on failure or cancellation. */
  readonly result?: unknown;
  readonly durationMs: number;
}

/**
 * The logging seam (spec 012): begin / progress / end of every request this
 * peer *handles* (never the ones it makes). Invoked where the peer creates
 * the request's controller, forwards a progress value, and settles the
 * handler — the only place "settled" is knowable after a close, since a
 * closed channel sends no frames. Progress is observed before the wire mute
 * that follows an abort, so narration after an abort still reaches the log.
 */
export interface PeerObserver {
  onRequestBegin?(info: ObservedRequestBegin): void;
  onProgress?(info: ObservedProgress): void;
  onRequestEnd?(info: ObservedRequestEnd): void;
}

/**
 * Why a running handler is aborted when the channel dies underneath it
 * (spec 012's named core change): a typed reason instead of `undefined`, so
 * a handler's own reporting — and the log observing it — can tell "the
 * caller cancelled" from "the caller vanished".
 */
export function connectionLostReason(): DetoxConnectionError {
  return new DetoxConnectionError('connection closed while the request was running', {
    code: DetoxErrorCode.DETOX_CONNECTION_LOST,
  });
}

/**
 * @issue DTX-1011: sweep cadence — one shared timer for the whole map, not a timer per record.
 * A timer per record is a handle per request — the same unbounded growth in a different allocator.
 */
const RETAIN_SWEEP_MS = 5_000;

export class Peer {
  private _nextId = 1;
  private _pending = new Map<string, PendingCall>();
  private _running = new Map<string, AbortController>();
  /** Requests this peer already answered — see {@link RETAIN_MS}. Insertion order is expiry order. */
  private _retained = new Map<string, RetainedRequest>();
  private _sweepTimer?: ReturnType<typeof setInterval>;
  private _requestHandlers = new Map<string, RequestHandler>();
  private _notifyHandlers = new Map<string, NotifyHandler>();
  private _errorHandlers: ErrorHandler[] = [];
  private _observers: PeerObserver[] = [];
  private _handlerScope: HandlerScope;
  private _closed = false;
  private _closeInfo?: CloseInfo;

  private constructor(private _channel: Channel, options: PeerOptions) {
    this._handlerScope = options.handlerScope ?? ((_info, run) => run());
    _channel.onMessage((msg) => this._onMessage(msg as RpcMessage));
    _channel.onClose((info) => this._onClose(info));
    _channel.onError((err) => this._onError(err));
  }

  static create(channel: Channel, options: PeerOptions = {}): Peer {
    return new Peer(channel, options);
  }

  /**
   * Registers a listener for non-fatal errors this peer cannot report to
   * anyone else: a send that failed to serialize, or a compensation registered
   * through `ctx.onUndo` that threw while unwinding (the `undo-failed` outcome
   * tells the caller *that* it failed; only this listener can say what).
   */
  onError(handler: ErrorHandler): this {
    this._errorHandlers.push(handler);
    return this;
  }

  private _onError(err: Error): void {
    for (const handler of this._errorHandlers) handler(err);
  }

  /**
   * Registers a {@link PeerObserver} over the requests this peer handles.
   * Additive; an observer that throws is reported through {@link onError}
   * and never disturbs the request it was watching.
   */
  observe(observer: PeerObserver): this {
    this._observers.push(observer);
    return this;
  }

  private _observe(call: (observer: PeerObserver) => void): void {
    for (const observer of this._observers) {
      try {
        call(observer);
      } catch (err) {
        this._onError(err instanceof Error ? err : new Error(String(err)));
      }
    }
  }

  request<T>({ method, params, signal, onProgress, step }: RequestCallOpts): Promise<T> {
    // @issue DTX-1010: an already-aborted signal beats a closed peer — the abort explains the close.
    if (signal?.aborted) return Promise.reject(new AbortError(signal.reason));
    if (this._closed) return Promise.reject(this._closeError('Peer is closed'));

    const id = String(this._nextId++);
    const req: RpcRequest = { jsonrpc: '2.0', id, method, params, ...(step !== undefined ? { step } : {}) };

    return new Promise<T>((resolve, reject) => {
      const pending: PendingCall = {
        resolve: resolve as (v: unknown) => void,
        reject,
        onProgress,
      };
      this._pending.set(id, pending);

      if (signal) {
        // @issue DTX-1009: no grace timer — an aborted call settles only on
        // an acknowledgment or the channel closing.
        //
        // This assumes a send that fails irrecoverably ends in a close —
        // today `ws-channel` reports a failed send without closing, rescued
        // only by the socket's own imminent 'close' (a known gap).
        signal.addEventListener('abort', () => {
          const entry = this._pending.get(id);
          if (!entry || entry.aborted) return;
          entry.aborted = true;
          entry.abortReason = signal.reason;
          this.notify({ method: '$/cancelRequest', params: { id } });
        }, { once: true });
      }

      // A channel whose `send` throws synchronously would reject this
      // executor while leaving the `_pending` entry behind until close; no
      // current channel does (ws-channel catches its own throws), but the
      // hazard belongs to whoever writes the next one.
      this._channel.send(req);
    });
  }

  notify({ method, params }: NotifyOpts): void {
    if (this._closed) return;
    this._channel.send({ jsonrpc: '2.0', method, params });
  }

  onRequest({ method, handler }: OnRequestOpts): this {
    this._requestHandlers.set(method, handler);
    return this;
  }

  onNotify({ method, handler }: OnNotifyOpts): this {
    this._notifyHandlers.set(method, handler);
    return this;
  }

  createMethod<P, R>(method: string): (params: P, opts?: CallOptions) => Promise<R> {
    return (params: P, opts?: CallOptions) => this.request<R>({ method, params, ...opts });
  }

  createNotification<P>(method: string): (params: P) => void {
    return (params: P) => this.notify({ method, params });
  }

  /** Returns a registrar: call it with a handler to register it for this method. */
  createMethodHandler<P, R>(method: string): (handler: RequestHandler<P, R>) => void {
    return (handler: RequestHandler<P, R>) => {
      this.onRequest({ method, handler: handler as RequestHandler });
    };
  }

  /** Returns a registrar: call it with a handler to register it for this notification. */
  createNotificationHandler<P>(method: string): (handler: NotifyHandler<P>) => void {
    return (handler: NotifyHandler<P>) => {
      this.onNotify({ method, handler: handler as NotifyHandler });
    };
  }

  private _onMessage(msg: RpcMessage): void {
    if (isRpcResponse(msg)) {
      this._handleResponse(msg);
    } else if (isRpcRequest(msg)) {
      void this._handleRequest(msg);
    } else if (isRpcNotification(msg)) {
      this._handleNotification(msg);
    }
  }

  private _handleResponse(res: RpcResponse): void {
    const pending = this._pending.get(res.id);
    if (!pending) return;

    if (pending.aborted && !res.error) {
      // @issue DTX-1003: a stale successful answer does not settle an
      // aborted call; only `$/cancelAck` or the channel closing does.
      // Every error response falls through and settles immediately instead.
      return;
    }

    this._pending.delete(res.id);
    if (pending.aborted) {
      // A `-32800` answer carries what its rollback did; anything else that
      // settles an aborted call (a plain failure that raced the abort) says
      // nothing about cleanup, so `outcome` stays absent.
      pending.reject(new AbortError(pending.abortReason, outcomeOf(res.error)));
    } else if (res.error) {
      pending.reject(errorFromWire(res.error.code, res.error.message, res.error.data));
    } else {
      pending.resolve(res.result);
    }
  }

  private async _handleRequest(req: RpcRequest): Promise<void> {
    const handler = this._requestHandlers.get(req.method);
    if (!handler) {
      this._channel.send({
        jsonrpc: '2.0',
        id: req.id,
        error: { code: -32601, message: `Method not found: ${req.method}` },
      });
      return;
    }

    const ac = new AbortController();
    this._running.set(req.id, ac);
    const startedAt = Date.now();
    const begin: ObservedRequestBegin = {
      id: req.id,
      method: req.method,
      params: req.params,
      signal: ac.signal,
      ...(req.step !== undefined ? { step: req.step } : {}),
    };
    this._observe((o) => o.onRequestBegin?.(begin));

    const progress = (value: unknown) => {
      // Observed before the mute: the log hears what the wire no longer can.
      this._observe((o) => o.onProgress?.({ id: req.id, value }));
      if (ac.signal.aborted) return;
      this.notify({ method: '$/progress', params: { token: req.id, value } });
    };

    const undo = new UndoStack((error) => this._onError(error));
    let ok = true;
    let error: WireError | undefined;
    let observedResult: unknown;

    try {
      const result = await this._handlerScope(begin, () =>
        handler(req.params, {
          signal: ac.signal,
          progress,
          onUndo: (fn) => undo.push(fn),
        }),
      );
      if (ac.signal.aborted) {
        ok = false;
        // The rollback runs inside the request's scope too: what it spawns is the request's.
        error = cancelledError(await this._unwind(begin, undo));
        this._sendCancelled(req.id, error);
      } else {
        // Retained *before* the response goes out, so the answer and the
        // ability to take it back are never observable in the wrong order.
        this._retain(req.id, undo, begin);
        observedResult = result;
        this._channel.send({ jsonrpc: '2.0', id: req.id, result });
      }
    } catch (err) {
      // @issue DTX-1004: any unsuccessful ending unwinds the stack, not cancellation alone.
      const outcome = await this._unwind(begin, undo);
      ok = false;
      if (ac.signal.aborted) {
        error = cancelledError(outcome);
        this._sendCancelled(req.id, error);
      } else {
        error = toWireError(err);
        this._channel.send({ jsonrpc: '2.0', id: req.id, error });
      }
    } finally {
      this._running.delete(req.id);
      this._observe((o) =>
        o.onRequestEnd?.({
          id: req.id,
          method: req.method,
          ok,
          error,
          ...(ok && observedResult !== undefined ? { result: observedResult } : {}),
          durationMs: Date.now() - startedAt,
        }),
      );
    }
  }

  /**
   * Runs a rollback inside the request's scope (spec 013: what it spawns
   * is the request's). The scope is the embedder's and must never be able
   * to wedge a request: a scope that rejects here reads as `undo-failed`,
   * which is the truth about the rollback as far as the caller can know it.
   */
  private _unwind(begin: ObservedRequestBegin, undo: UndoStack): Promise<CancelOutcome> {
    return this._handlerScope(begin, () => undo.run()).catch((err: unknown) => {
      this._onError(err instanceof Error ? err : new Error(String(err)));
      return 'undo-failed' as const;
    });
  }

  /**
   * Remembers an answered request for {@link RETAIN_MS}. Only successful
   * answers are retained: an error response — `-32800` included — has
   * already settled the caller and already unwound.
   */
  private _retain(id: string, undo: UndoStack, begin: ObservedRequestBegin): void {
    this._retained.set(id, { undo, expiresAt: Date.now() + RETAIN_MS, begin });

    while (this._retained.size > RETAIN_MAX) {
      const oldest = this._retained.keys().next();
      if (oldest.done) break;
      this._retained.delete(oldest.value);
    }

    if (!this._sweepTimer) {
      this._sweepTimer = setInterval(() => this._sweepRetained(), RETAIN_SWEEP_MS);
      // A bookkeeping timer must never be the reason a process refuses to exit.
      this._sweepTimer.unref?.();
    }
  }

  private _sweepRetained(): void {
    const now = Date.now();
    for (const [id, record] of this._retained) {
      // Every record gets the same window, so insertion order is expiry order:
      // the first survivor ends the sweep.
      if (record.expiresAt > now) break;
      this._retained.delete(id);
    }
    if (this._retained.size === 0) this._stopSweeper();
  }

  private _stopSweeper(): void {
    if (!this._sweepTimer) return;
    clearInterval(this._sweepTimer);
    this._sweepTimer = undefined;
  }

  /** @issue DTX-1006: a cancel that finds nothing running still gets an answer, never silence. */
  private async _acknowledgeLateCancel(id: string): Promise<void> {
    const retained = this._retained.get(id);
    // @issue DTX-1000: deleted only after the rollback settles — a duplicate
    // cancel arriving mid-unwind joins that run rather than being told `unknown`.
    const outcome: CancelOutcome = retained ? await this._unwind(retained.begin, retained.undo) : 'unknown';
    this._retained.delete(id);
    this.notify({ method: '$/cancelAck', params: { id, outcome } });
  }

  /** @issue DTX-1005: the outcome rides this frame; no separate `$/cancelAck` follows it. */
  private _sendCancelled(id: string, error: WireError): void {
    this._channel.send({ jsonrpc: '2.0', id, error });
  }

  private _handleNotification(notif: RpcNotification): void {
    if (isCancelRequestNotification(notif)) {
      const { id } = notif.params;
      const running = this._running.get(id);
      if (running) {
        // Still working: aborting it is the whole answer, and the `-32800` it
        // produces is the acknowledgment.
        running.abort();
        return;
      }
      void this._acknowledgeLateCancel(id);
      return;
    }

    if (isCancelAckNotification(notif)) {
      const { id, outcome } = notif.params;
      const pending = this._pending.get(id);
      // Only an aborted call is waiting on one of these. Anything else is a
      // stray ack — a duplicate, or one for a call that already settled.
      if (!pending?.aborted) return;
      this._pending.delete(id);
      // The ack still settles the call even if its `outcome` is malformed —
      // arrival is the signal, the word is the detail — but a non-string never
      // reaches the caller in a field typed as words, exactly as on the
      // `-32800` carrier.
      const word = readOutcome(outcome);
      pending.reject(new AbortError(pending.abortReason, word === undefined ? undefined : { outcome: word }));
      return;
    }

    if (isProgressNotification(notif)) {
      const { token, value } = notif.params;
      this._pending.get(token)?.onProgress?.(value);
      return;
    }

    const handler = this._notifyHandlers.get(notif.method);
    handler?.(notif.params);
  }

  private _onClose(info?: CloseInfo): void {
    this._closed = true;
    this._closeInfo = info;
    // A typed reason (spec 012): the handler was not cancelled, its caller is gone.
    for (const ac of this._running.values()) ac.abort(connectionLostReason());
    this._running.clear();
    // @issue DTX-1007: retention is dropped without unwinding — a dead socket
    // is compensated at connection level instead.
    this._retained.clear();
    this._stopSweeper();
    for (const pending of this._pending.values()) {
      if (pending.aborted) {
        // @issue DTX-1008: `unknown` and nothing softer — whether the remote
        // side rolled anything back is genuinely unknown once the socket died.
        pending.reject(new AbortError(pending.abortReason, { outcome: 'unknown' }));
      } else {
        pending.reject(this._closeError('Channel closed'));
      }
    }
    this._pending.clear();
  }

  /**
   * "Channel closed" alone sends a developer hunting through server logs; the
   * close frame's reason (e.g. the keepalive verdict on a client that was
   * paused too long) says why in the error they are already looking at. The
   * numeric close code rides along as `details.closeCode` so callers can
   * branch on it without matching prose — the sentence is for humans, the
   * code is the API. Close code 4001 is the server's own keepalive verdict:
   * it gets its own Detox code rather than sharing `DETOX_CONNECTION_LOST`
   * with every other reason a socket dies.
   */
  private _closeError(prefix: string): DetoxConnectionError {
    const info = this._closeInfo;
    const message = info?.reason ? `${prefix}: ${info.reason}` : prefix;
    // 4002 is the client's own version-skew refusal: the session closed
    // itself on a mismatched `$/serverInfo`, and every call it settles
    // should say so, not "connection lost".
    const code =
      info?.code === 4001
        ? DetoxErrorCode.DETOX_SESSION_EXPIRED
        : info?.code === 4002
          ? DetoxErrorCode.DETOX_VERSION_SKEW
          : DetoxErrorCode.DETOX_CONNECTION_LOST;
    return new DetoxConnectionError(message, {
      code,
      details: info?.code !== undefined ? { closeCode: info.code } : undefined,
    });
  }
}
