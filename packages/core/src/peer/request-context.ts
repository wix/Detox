import type { UndoFn } from './undo-stack';

export interface RequestContext<TProgress = unknown> {
  signal: AbortSignal;
  progress(value: TProgress): void;
  /**
   * Registers a compensation for an effect that just landed. The stack
   * unwinds LIFO on any unsuccessful ending of this request: the handler
   * throwing, the caller cancelling mid-flight, or a cancellation that
   * arrived after the answer was already sent.
   *
   * Available to every handler, mandatory for none: the caller is told
   * `nothing-to-undo` either way, and cannot tell "this work has no undo"
   * from "nobody wrote one". A handler with a physical effect that stays
   * behind is expected to register it here, but nothing enforces that.
   */
  onUndo(fn: UndoFn): void;
}

export interface CallOptions<TProgress = unknown> {
  signal?: AbortSignal;
  onProgress?: (value: TProgress) => void;
}

export type RequestHandler<TParams = unknown, TResult = unknown> = (
  params: TParams,
  ctx: RequestContext,
) => Promise<TResult>;

export type NotifyHandler<TParams = unknown> = (params: TParams) => void;

export interface RequestCallOpts<TParams = unknown, TProgress = unknown> {
  method: string;
  params?: TParams;
  signal?: AbortSignal;
  onProgress?: (value: TProgress) => void;
}

export interface NotifyOpts<TParams = unknown> {
  method: string;
  params?: TParams;
}

export interface OnRequestOpts {
  method: string;
  handler: RequestHandler;
}

export interface OnNotifyOpts {
  method: string;
  handler: NotifyHandler;
}
