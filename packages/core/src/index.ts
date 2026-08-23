export type { Channel, MemoryChannel, WebSocketChannel } from './channel';
export { memoryChannel, createWebSocketChannel } from './channel';

export {
  DetoxErrorCode,
  DetoxError,
  AbortError,
  DetoxConnectionError,
  DevicePoolExhaustedError,
  NoMatchingDeviceError,
  DeviceUnknownStateError,
} from './errors';
export type { DetoxErrorOptions, AbortErrorDetails } from './errors';

export { errorFromWire, toWireError } from './errors';
export type { WireError } from './errors';

export { BlobLaneClient, blobLanePath } from './blob-lane';
export type { BlobLaneAddress, BlobPutOptions } from './blob-lane';

export { Peer } from './peer';
export type {
  RpcRequest,
  RpcResponse,
  RpcNotification,
  RpcMessage,
  RequestContext,
  RequestHandler,
  NotifyHandler,
  RequestCallOpts,
  NotifyOpts,
  OnRequestOpts,
  OnNotifyOpts,
  CallOptions,
  CancelOutcome,
  UndoFn,
} from './peer';
