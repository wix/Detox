// Internal barrel — the `detox` bin is this package's one consumer: no
// public export path, no `detox/config` subpath. A second executable needing
// the resolver would be the reason to revisit that.
export { ConfigError, UsageError } from './errors';
export { discoverConfig, findConfigFile, loadConfigFile, applyExtends, deepMerge, resolveConfigOverride, CONFIG_FILENAMES } from './discover';
export { selectConfigurationName } from './select';
export { composeRun, refuseLegacyKeys, resolveServerSection, type ComposedRun, type ServerSection, type RosterNode } from './compose';
export { resolveRun, resolveServing, type ResolvedRun, type ResolvedServing } from './resolve';
export { writeSnapshotFile, deleteSnapshotFile } from './io';
export {
  splitCliArgv,
  refuseUnknownFlags,
  buildRunnerInvocation,
  buildRunnerEnv,
  serverSectionToArgs,
  collectBuildCommands,
} from './argv';
export { parseLogsArgv, LOGS_HELP, type LogsArgv } from './logs-argv';
export { resolveLogsServer, httpOriginOf, type LogsServer } from './logs-server';
export { createLogsHttp, type LogsHttp, type RunIndexRow } from './logs-http';
export { runLogs, formatIndexRow, LOGS_REFUSAL_EXIT, type LogsDeps, type LogsIo } from './logs';
export { readRunRows, formatRunLines, GATED_HINT, type RunRow } from './run-lines';
