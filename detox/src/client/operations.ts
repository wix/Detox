/**
 * The operation machinery behind every `detox/client` call.
 *
 * An operation is one object wearing two hats: the flyweight ref carried by
 * every progress event ({@link DetoxOperationRef}) and the promise the caller
 * awaits ({@link DetoxOperation}). It delegates `then`/`catch`/`finally` to an
 * inner promise rather than extending `Promise` — subclassing drags in
 * `Symbol.species` and rebuilds the object on every `.then()`.
 */
import { AsyncLocalStorage } from 'node:async_hooks';

import type {
  DetoxOperationEndEvent,
  DetoxOperationName,
  DetoxOperationRef,
  DetoxProgressEvent,
} from '../client';
import { AbortError } from './errors';

type ProgressListener = (event: DetoxProgressEvent) => void;
type EndListener = (event: DetoxOperationEndEvent) => void;
type OperationListener = (operation: DetoxOperationRef) => void;

/** @issue DTX-3004: calls a subscriber without letting it change what happened. */
function notify<E>(listeners: Iterable<(event: E) => void>, event: E, channel: string): void {
  // A copy: a listener may subscribe or unsubscribe while we iterate.
  for (const listener of [...listeners]) {
    try {
      listener(event);
    } catch (error) {
      console.error(`[detox] a "${channel}" listener threw; ignoring it:`, error);
    }
  }
}

interface OperationInit {
  id: string;
  name: DetoxOperationName;
  parent?: OperationImpl<unknown>;
  /** Session/call/parent signals; the operation's own controller is implied. */
  extraSignals?: readonly (AbortSignal | undefined)[];
  /** @issue DTX-3005: escalates to whoever owns the wire call (no request of its own to cancel). */
  onAbort?: (reason?: unknown) => void;
}

export class OperationImpl<T> implements DetoxOperationRef, Promise<T> {
  readonly id: string;
  readonly name: DetoxOperationName;
  readonly parent?: OperationImpl<unknown>;
  readonly startedAt = Date.now();
  readonly origin: Error;
  readonly signal: AbortSignal;

  #controller = new AbortController();
  #onAbort?: (reason?: unknown) => void;
  #progressListeners = new Set<ProgressListener>();
  #endListeners = new Set<EndListener>();
  #children = new Map<DetoxOperationName, OperationImpl<unknown>>();
  #promise?: Promise<T>;
  #settled = false;

  constructor(init: OperationInit) {
    this.id = init.id;
    this.name = init.name;
    this.parent = init.parent;
    // Captured once, at creation: the stack points at the caller's line.
    this.origin = new Error(`Detox operation "${init.name}"`);
    this.#onAbort = init.onAbort;
    const signals = [
      this.#controller.signal,
      ...(init.extraSignals ?? []).filter((s): s is AbortSignal => s !== undefined && s !== null),
    ];
    this.signal = signals.length > 1 ? AbortSignal.any(signals) : signals[0];
  }

  abort(reason?: unknown): void {
    if (this.#onAbort) {
      this.#onAbort(reason);
    } else {
      this.#controller.abort(reason);
    }
  }

  on(event: 'progress', listener: ProgressListener): this;
  on(event: 'end', listener: EndListener): this;
  on(event: 'progress' | 'end', listener: ProgressListener | EndListener): this {
    if (event === 'progress') this.#progressListeners.add(listener as ProgressListener);
    else this.#endListeners.add(listener as EndListener);
    return this;
  }

  off(event: 'progress', listener: ProgressListener): this;
  off(event: 'end', listener: EndListener): this;
  off(event: 'progress' | 'end', listener: ProgressListener | EndListener): this {
    if (event === 'progress') this.#progressListeners.delete(listener as ProgressListener);
    else this.#endListeners.delete(listener as EndListener);
    return this;
  }

  /**
   * Delivers a progress event to this operation's subscribers and to every
   * ancestor's: a per-call handler sees its own operation and the ones it
   * started, which is exactly the chain upwards from the emitting node.
   */
  dispatchProgress(event: DetoxProgressEvent): void {
    notify(this.#progressListeners, event, 'progress');
    this.parent?.dispatchProgress(event);
  }

  /** Emits `end` exactly once. Unlike progress, `end` does not bubble. */
  settle(outcome: { ok: true } | { ok: false; error: unknown }): void {
    if (this.#settled) return;
    this.#settled = true;
    const timestamp = Date.now();
    const base = {
      type: 'end' as const,
      operation: this,
      durationMs: timestamp - this.startedAt,
      timestamp,
    };
    const event: DetoxOperationEndEvent = outcome.ok
      ? { ...base, ok: true }
      : { ...base, ok: false, error: outcome.error };
    notify(this.#endListeners, event, 'end');
  }

  child(name: DetoxOperationName): OperationImpl<unknown> | undefined {
    return this.#children.get(name);
  }

  adoptChild(child: OperationImpl<unknown>): void {
    this.#children.set(child.name, child);
  }

  adoptPromise(promise: Promise<T>): void {
    this.#promise = promise;
  }

  get #inner(): Promise<T> {
    if (!this.#promise) {
      throw new Error(`Operation "${this.name}" is not awaitable`);
    }
    return this.#promise;
  }

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.#inner.then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null,
  ): Promise<T | TResult> {
    return this.#inner.catch(onrejected);
  }

  finally(onfinally?: (() => void) | null): Promise<T> {
    return this.#inner.finally(onfinally);
  }

  get [Symbol.toStringTag](): string {
    return 'DetoxOperation';
  }
}

export interface RunOptions<T> {
  signal?: AbortSignal;
  onProgress?: ProgressListener;
  execute: (operation: OperationImpl<T>) => Promise<T>;
}

/**
 * Creates operations, wires their signals and parentage, and owns the
 * session-wide `operation` channel.
 *
 * Parentage comes from `AsyncLocalStorage` on the caller side; operations
 * created in response to an incoming message get an explicit parent instead
 * (ALS does not survive that boundary) — see {@link beginChild}.
 */
export class OperationRegistry {
  #als = new AsyncLocalStorage<OperationImpl<unknown>>();
  #listeners = new Set<OperationListener>();
  #nextId = 1;
  #sessionSignal?: AbortSignal;
  #ambient?: () => AbortSignal | undefined;

  /**
   * `ambient` is the runner-integration door (@internal): a provider sampled
   * at operation creation, so a test runner can scope every call made during
   * a test to that test's own AbortController without any caller passing a
   * signal. Never public API — reached only through compat's internal state.
   */
  constructor(sessionSignal?: AbortSignal, ambient?: () => AbortSignal | undefined) {
    this.#sessionSignal = sessionSignal;
    this.#ambient = ambient;
  }

  onOperation(listener: OperationListener): void {
    this.#listeners.add(listener);
  }

  offOperation(listener: OperationListener): void {
    this.#listeners.delete(listener);
  }

  run<T>(name: DetoxOperationName, options: RunOptions<T>): OperationImpl<T> {
    const parent = this.#als.getStore();
    const operation = new OperationImpl<T>({
      id: this.#id(),
      name,
      parent,
      extraSignals: [this.#sessionSignal, this.#ambient?.(), options.signal, parent?.signal],
    });
    if (options.onProgress) operation.on('progress', options.onProgress);
    // Announced at creation time, before it starts reporting — but progress
    // itself only ever arrives asynchronously (off the wire), so a subscriber
    // one statement late still sees every event.
    this.#announce(operation);

    let inner: Promise<T>;
    try {
      inner = Promise.resolve(this.#als.run(operation, () => options.execute(operation)));
    } catch (error) {
      inner = Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }

    const promise = inner.then(
      (value) => {
        operation.settle({ ok: true });
        return value;
      },
      (error: unknown) => {
        // @issue DTX-3006: a rejection displaced by abort survives on
        // AbortError.details.displaced, never mutated onto the reason object.
        const mapped =
          operation.signal.aborted && (error as Error | null)?.name !== 'AbortError'
            ? new AbortError(operation.signal.reason, { displaced: error })
            : error;
        operation.settle({ ok: false, error: mapped });
        throw mapped;
      },
    );
    // A handle taken but not awaited must never crash the process; awaiting
    // the operation still surfaces the rejection through the delegates.
    promise.catch(() => {});
    operation.adoptPromise(promise);
    return operation;
  }

  /** A sub-operation the server started on its own, e.g. boot-in-allocate. */
  beginChild(name: DetoxOperationName, parent: OperationImpl<unknown>): OperationImpl<unknown> {
    const child = new OperationImpl<unknown>({
      id: this.#id(),
      name,
      parent,
      extraSignals: [parent.signal],
      onAbort: (reason) => parent.abort(reason),
    });
    parent.adoptChild(child);
    this.#announce(child);
    return child;
  }

  #announce(operation: OperationImpl<unknown>): void {
    notify(this.#listeners, operation as DetoxOperationRef, 'operation');
  }

  #id(): string {
    return `op-${this.#nextId++}`;
  }
}
