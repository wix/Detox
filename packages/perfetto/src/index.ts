/**
 * `@detox-remote/perfetto` (spec 012a): the Perfetto projection of a
 * connection log. Data in, data out — no dependencies, and the 012 line
 * shape is re-declared structurally rather than imported from the server
 * (the server imports this package to mount the route; the reverse edge
 * would be a cycle).
 */
export {
  toChromeTrace,
  parseTraceLines,
  describeNode,
  hopOf,
  LOCAL_PID,
  CONNECTION_ROW,
  SERVER_LOCAL_NAME,
  RELAY_LOCAL_NAME,
  laneTid,
  type TraceLogLine,
  type TraceLogLevel,
  type TraceLogKind,
  type TraceLogNode,
  type TraceEvent,
  type TraceEventPhase,
  type TraceMetadata,
  type ChromeTrace,
  type ToChromeTraceOptions,
} from './trace';
export { renderPerfettoViewer, PERFETTO_UI_ORIGIN, type PerfettoViewerPage } from './viewer';
// The text views (spec 013): the same names as the trace, as an outline, a failure cut, a subtree.
export { buildTree, subtreeLines, ancestryOf, isConnectionNode, seqOf, type TreeNode, type LogTree } from './tree';
export { toOutline, COLLAPSE_FROM, type OutlineOptions } from './outline';
export { toFailures, innermostFailures, errorLinesOf, ticksAround, failed, type FailuresOptions } from './failures';
export { selectUnder, matchesUnder, type Selection } from './subtree';
export { formatDuration, lineNameOf, plainNameOf, durationOf, formatTick, layoutColumns } from './format';
export { describeRpc, describeInvocation, describeMatcher, describeDeviceQuery, describeDevice, describeApp, describeConnection, describeSpawn, describeOutcome } from './names';
