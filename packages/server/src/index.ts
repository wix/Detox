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
