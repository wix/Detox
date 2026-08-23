export type MessageHandler<T = unknown> = (msg: T) => void;
/**
 * Why the channel closed, when the transport knows — a WebSocket close frame's
 * code and reason. Absent for transports (or deaths) that carry no farewell:
 * an errored socket, a local close, an in-memory pair.
 */
export interface CloseInfo {
  code?: number;
  reason?: string;
}
export type CloseHandler = (info?: CloseInfo) => void;
/** Reports a non-fatal send failure (e.g. an unserializable payload) — the channel stays open. */
export type ErrorHandler = (err: Error) => void;

export interface Channel {
  send(msg: unknown): void;
  /** @issue DTX-1017: additive, not a single slot. */
  onMessage(handler: MessageHandler): void;
  /** @issue DTX-1016: additive, not a single slot. */
  onClose(handler: CloseHandler): void;
  /** Adds an error listener; additive, for the same reason as {@link onClose}. */
  onError(handler: ErrorHandler): void;
}
