export { createDetoxRelay, DEFAULT_HOST, type DetoxRelay, type RelayDeps } from './relay';
export { RelaySession, ALLOCATION_STALL_MS, type SessionNode, type RelaySessionOptions } from './session';
export { parseNodesConfig, type RelayNodeConfig } from './nodes';
export { dialNodeChannel } from './upstream';
export { ensureBlobOnNode, type EnsureBlobOutcome, type EnsureBlobDeps } from './blob-bridge';
export { resolveRelayCli, dialableUrl, RelayCliError, type ResolvedRelayCli } from './cli-config';
export { RELAY_LOG_PREFIX } from './log';
// The relay CLI's whole logic, callable — the `detox relay` verb (spec 009)
// delegates here so it cannot drift from the legacy entry.
export { runRelayCli, reportRelayCliError, type RelayCliInput } from './cli-main';
