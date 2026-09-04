export {
  createDetoxRemoteServer,
  createDetoxRemoteServer as createServer,
  DEFAULT_HOST,
  type DetoxRemoteServer,
  type ServerDeps,
} from './server';

export {
  DEFAULT_KEEPALIVE,
  KEEPALIVE_OFF,
  startKeepalive,
  type KeepaliveOptions,
  type KeepaliveConfig,
} from './keepalive';

// The blob lane's HTTP half, reused wholesale by the relay's own port
// (spec 008 — one lane implementation on every hop).
export {
  BLOB_LANE_PREFIX,
  isBlobLaneRequest,
  handleBlobLaneRequest,
  refuse,
  type BlobLaneDeps,
} from './blob-http';

export {
  BlobStore,
  BlobRefusal,
  DEFAULT_BLOB_ROOT,
  DEFAULT_BLOB_BUDGET_BYTES,
  type BlobStoreOptions,
} from './BlobStore';

export {
  assertUsableToken,
  generateToken,
  isAuthorized,
  type AuthConfig,
  type StaticTokenAuth,
} from './auth';

// The server CLI's whole logic, callable — the `detox server` verb
// (spec 009) delegates here so it cannot drift from the
// legacy standalone entry.
export { runServerCli, dialableUrl, type ServerCliInput } from './cli-main';
export { parseDuration } from './duration';
export { SERVER_SETTINGS } from './settings';

// The connection log (spec 012), reused wholesale by the relay's own log
// root (spec 008) — one lane implementation, used twice, the
// `BlobStore` precedent above.
export {
  LogStore,
  CONN_NODE,
  DEFAULT_LOG_BUDGET_BYTES,
  type LogStoreOptions,
  type ConnectionIndexRow,
  type ReadOptions,
} from './LogStore';
export {
  ConnectionLog,
  CONNECTION_CAP_BYTES,
  type LogLine,
  type LogLineInput,
  type LogLineKind,
  type LogNode,
  type LogNodeType,
} from './ConnectionLog';
export {
  RUNS_PREFIX,
  isConnectionLogRequest,
  handleConnectionLogRequest,
  type ConnectionLogDeps,
} from './log-http';
/** Spec 012a's two `localName` constants, re-exported so the relay names its hop without depending on the projection package. */
export { SERVER_LOCAL_NAME, RELAY_LOCAL_NAME } from '@detox-remote/perfetto';
export {
  LOG_LEVELS,
  isLogLevel,
  passesLevel,
  createServerLogSink,
  type LogLevel,
  type ServerLogSink,
} from './log-sink';
export { judgeAttrs, judgeLogError, type AttrsRejected, type JudgedLogError } from './ConnectionRecorder';

// The driver seam (spec 015): what a driver package implements. Published
// through the `detox/server` door so `@acme/detox-driver-foo` can type its
// `createDriver(toolkit)` against the contract the server calls.
export type {
  DeviceDriver,
  DeviceLease,
  DeviceLeaseInfo,
  DriverAllocateArgs,
  DriverBiometricEnrollmentArgs,
  DriverBiometricMatchArgs,
  DriverBootArgs,
  DriverBundleArgs,
  DriverInstallArgs,
  DriverLaunchArgs,
  DriverLaunchOutput,
  DriverLaunchResult,
  DriverLog,
  DriverModule,
  DriverOpenUrlArgs,
  DriverPermissionsArgs,
  DriverSetLocationArgs,
  DriverSignalArgs,
  DriverStatusBarArgs,
  DriverTerminateArgs,
  DriverToolkit,
  DriverWipeArgs,
} from './driver';
export { AppGateway, type AppGatewayOptions, type AppSession } from './AppGateway';
// The typed errors a driver throws — the same classes the built-in imports
// from core, published here so an npm driver constructs the same ones the
// wire reconstructs by code (`toolkit.errors` is the zero-import path).
export {
  AbortError,
  DetoxError,
  DetoxErrorCode,
  DevicePoolExhaustedError,
  DeviceUnknownStateError,
  NoMatchingDeviceError,
} from '@detox-remote/core';
export type { AppOutputSink } from './app-output';
export type { ExecOpts, ExecResult } from './exec';
