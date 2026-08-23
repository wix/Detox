/**
 * What became of the work a cancellation raced.
 *
 * It travels on two carriers, and they are not alternatives: the `-32800`
 * response when the cancellation caught the handler still running, and the
 * `$/cancelAck` notification when the answer had already gone out. Same
 * vocabulary, same meaning, read through the same {@link readOutcome}.
 *
 * Every value is computed from facts the responder observed, never from a
 * label the handler's author declared up front.
 *
 * - `undone` — the handler had registered compensations and every one of them
 *   ran to completion.
 * - `nothing-to-undo` — the handler registered no compensation at all. It
 *   means the ledger is empty, not that no side effect happened: it is the
 *   answer both for work that genuinely has no undo (an `invoke` already
 *   delivered to an app cannot be un-delivered) and for a handler that
 *   simply registered none.
 * - `undo-failed` — at least one compensation threw. The caller should treat
 *   the resource as suspect.
 * - `unknown` — the responder has no record of that request id: it was never
 *   issued, or its retention window has already closed. Answered fast:
 *   the requester holds an aborted call open until an answer
 *   or channel close, so a miss that stayed silent would park it forever.
 */
export type CancelOutcome = 'undone' | 'nothing-to-undo' | 'undo-failed' | 'unknown';

/**
 * Reads `outcome` from either carrier. Unknown strings pass through (a newer
 * peer may know a word this one does not); non-strings are dropped.
 */
export function readOutcome(value: unknown): CancelOutcome | undefined {
  return typeof value === 'string' ? (value as CancelOutcome) : undefined;
}

/** A compensating action a handler registered through `ctx.onUndo`. */
export type UndoFn = () => void | Promise<void>;

/**
 * The per-request rollback ledger behind `ctx.onUndo` — one entry per effect
 * that actually landed, written as the effect lands.
 *
 * @issue DTX-1001: unwinds LIFO — the last effect to happen is the first taken back.
 * @issue DTX-1000: runs at most once, no matter how many callers reach it.
 */
export class UndoStack {
  private readonly _fns: UndoFn[] = [];
  private _running?: Promise<CancelOutcome>;

  /**
   * @param onError where a throwing compensation is reported. The outcome
   * says that a rollback failed; only this callback can say what failed.
   */
  constructor(private readonly _onError: (error: Error) => void) {}

  /**
   * Registering after the unwind has started is a no-op in practice: the loop
   * has already walked past the tail. The ledger is written as effects land,
   * not afterwards.
   */
  push(fn: UndoFn): void {
    this._fns.push(fn);
  }

  /** @issue DTX-1002: never rejects — a blown-up rollback still comes back as a value. */
  run(): Promise<CancelOutcome> {
    return (this._running ??= this._unwind());
  }

  private async _unwind(): Promise<CancelOutcome> {
    if (this._fns.length === 0) return 'nothing-to-undo';

    let failed = false;
    for (let i = this._fns.length - 1; i >= 0; i--) {
      try {
        await this._fns[i]();
      } catch (error) {
        // @issue DTX-1001: one failing compensation does not strand the ones registered under it.
        failed = true;
        this._report(error);
      }
    }
    return failed ? 'undo-failed' : 'undone';
  }

  /**
   * The reporter is user code (`peer.onError` listeners), so it can throw too.
   * Reporting is the least important thing happening here — losing a log line
   * is survivable, losing the response is not.
   */
  private _report(error: unknown): void {
    try {
      this._onError(error instanceof Error ? error : new Error(String(error)));
    } catch {
      // Nowhere left to report to; the `undo-failed` outcome still travels.
    }
  }
}
