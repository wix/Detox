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

export { Peer, connectionLostReason } from './peer';
export type {
  PeerObserver,
  ObservedRequestBegin,
  ObservedProgress,
  ObservedRequestEnd,
  HandlerScope,
  PeerOptions,
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

export {
  resolveSection,
  configShape,
  toChildArgs,
  helpLines,
  SettingsError,
} from './settings';
export type { SettingDescriptor, ResolveInput, InferSection } from './settings';
