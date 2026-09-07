export interface RpcRequest {
  jsonrpc: '2.0';
  id: string;
  method: string;
  params?: unknown;
  /**
   * The one extension member this dialect adds to a JSON-RPC request (spec
   * 013): the client-minted id of the step the request was made under, so
   * the responder's log can parent the request explicitly rather than by
   * "the most recently begun open step" — the rule `test.concurrent` breaks.
   * Optional, ignored by a responder that predates it.
   */
  step?: string;
}

export interface RpcResponse {
  jsonrpc: '2.0';
  id: string;
  result?: unknown;
  /**
   * `data` carries a `DetoxError`'s `.details` (spec 004) — structured, never
   * prose. Absent on the JSON-RPC generic codes that predate the taxonomy
   * (`-32601`, an unclassified `-32000`), with one exception: `-32800`
   * (cancelled) always carries `{outcome}`, naming what the responder's
   * rollback did. It is the one generic code that has something to report
   * beyond its own number.
   */
  error?: { code: number; message: string; data?: unknown };
}

export interface RpcNotification {
  jsonrpc: '2.0';
  method: string;
  params?: unknown;
}

export type RpcMessage = RpcRequest | RpcResponse | RpcNotification;

export function isRpcRequest(msg: RpcMessage): msg is RpcRequest {
  return 'id' in msg && 'method' in msg;
}

export function isRpcResponse(msg: RpcMessage): msg is RpcResponse {
  return 'id' in msg && !('method' in msg);
}

export function isRpcNotification(msg: RpcMessage): msg is RpcNotification {
  return !('id' in msg) && 'method' in msg;
}
