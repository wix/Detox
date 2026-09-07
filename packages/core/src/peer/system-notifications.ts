import type { RpcNotification } from './rpc-types';
import type { CancelOutcome } from './undo-stack';

/**
 * `$/`-prefixed notifications are Peer's own control-channel messages, borrowed
 * from the Language Server Protocol (method names, `$/` prefix convention, and
 * the `id`/`token`/`value` param shapes below all come from the LSP spec) —
 * plain JSON-RPC 2.0 has no notion of cancellation or progress.
 */

export interface CancelRequestNotification extends RpcNotification {
  method: '$/cancelRequest';
  params: { id: string };
}

/**
 * The requester's `$/cancelRequest` reached the responder after the request had
 * already been answered — this says what the responder did about it.
 *
 * A notification, never a second response to the same id: JSON-RPC allows
 * exactly one response per id, and the ack must be able to arrive after one
 * was already sent.
 *
 * Additive for whoever receives it (a `$/`-prefixed notification is
 * ignorable by LSP convention), but not free for whoever expects it: a
 * requester holds an aborted call open until the ack arrives or the channel
 * closes, so a responder that never sends one parks that call for the
 * connection's whole remaining life.
 *
 * Sent on exactly one path: a `$/cancelRequest` that found no running
 * handler. When the handler is still running, the `-32800` response is
 * itself the acknowledgment, and no ack notification follows it.
 */
export interface CancelAckNotification extends RpcNotification {
  method: '$/cancelAck';
  params: { id: string; outcome: CancelOutcome };
}

export interface ProgressNotification extends RpcNotification {
  method: '$/progress';
  params: { token: string; value: unknown };
}

export function isCancelRequestNotification(notif: RpcNotification): notif is CancelRequestNotification {
  return notif.method === '$/cancelRequest';
}

export function isProgressNotification(notif: RpcNotification): notif is ProgressNotification {
  return notif.method === '$/progress';
}

/**
 * Lives next to `isCancelRequestNotification`: without a guard of its own,
 * `$/cancelAck` would fall through to the user notification handlers, where
 * a method nobody registered is silently dropped — the ack would simply
 * never be seen.
 *
 * A malformed frame is dropped, never thrown out of the dispatcher.
 * Checks the shape, not just the name: this is the one system notification a
 * remote peer can aim at a specific local call. It does not validate
 * `outcome` — an unrecognised value reaches the caller as-is, which is the
 * same forward-compatibility rule the error codes follow.
 */
export function isCancelAckNotification(notif: RpcNotification): notif is CancelAckNotification {
  if (notif.method !== '$/cancelAck') return false;
  const params = notif.params as CancelAckNotification['params'] | undefined;
  return typeof params?.id === 'string';
}
