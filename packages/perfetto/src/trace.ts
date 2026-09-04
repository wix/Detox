/**
 * The projection (spec 012a): spec 012's JSONL, line by line, to Chrome
 * Trace Event JSON the way Perfetto's JSON importer reads it.
 *
 * - `begin` + `end` of one node → one complete event `X` (`ts`, `dur` in
 *   microseconds, absolute: the log's `ts` is ms since epoch, ×1000).
 * - `begin` with no `end` → `B` (Perfetto draws "did not end"); never a
 *   bare `E` — an `end` for a node that never began is dropped (012 already
 *   logs it as a `warn` line, which is projected as a tick).
 * - `log` → a thread-scoped instant `i` on its node's lane.
 * - Processes are hops: the local hop is pid 1 (`localName`), each foreign
 *   hop (`mac-a/rpc:7`, spec 008's rewrite) the next pid.
 * - **Rows are nouns**: per hop, a `connection` row for the connection,
 *   its steps and its narration, then one row per allocated
 *   device, named after it, holding a synthetic device span
 *   (allocate → release) with a synthetic app span per launch
 *   (launch → terminate) nested inside, and every rpc addressed to that
 *   allocation / app handle under them. A row that would overlap spills to
 *   `<noun> +1`, `+2` (the nested-or-disjoint fit rule, unchanged).
 * - **Names are human**: `tap by.id("x")`, `allocateDevice
 *   iPhone 17 Pro`, `iPhone 17 Pro (FD83…)`, `com.wix.detox-example (pid
 *   19767)`, `<runId> from 127.0.0.1:56123` — see `names.ts`. The raw
 *   `method`/`params` stay in `args`.
 *
 * Prior art: Detox 20's `ChromeTraceTransformer.js` (passes each record's
 * own `ph` through, owns only the thread-id remapping) and `bunyamin`'s
 * `ThreadDispatcher.ts` (a lane is held for the whole nested lifetime of
 * what began on it). v21 has a declared tree and no thread ids, so it
 * derives rows from the tree and the handles.
 *
 * Nothing here sorts by `ts` for meaning: the file's `seq` decides which
 * line is a node's begin/end; `ts` only positions the drawing.
 */
import { describeApp, describeConnection, describeDevice, describeOutcome, describeRpc, describeSpawn } from './names';

export type TraceLogLevel = 'error' | 'warn' | 'info' | 'debug';
export type TraceLogKind = 'begin' | 'end' | 'log';

/** Spec 012's `node`, re-declared structurally (see the package header). */
export interface TraceLogNode {
  id: string;
  type: string;
  name: string;
  parent?: string;
}

/** Spec 012's line shape, re-declared structurally. */
export interface TraceLogLine {
  seq: number;
  ts: number;
  level: TraceLogLevel;
  kind: TraceLogKind;
  node: TraceLogNode;
  msg?: string;
  fields?: Record<string, unknown>;
}

export type TraceEventPhase = 'X' | 'B' | 'i' | 'M';

/** One Chrome Trace Event, the subset this projection emits. */
export interface TraceEvent {
  name: string;
  cat?: string;
  ph: TraceEventPhase;
  /** Microseconds since the epoch (absent only on `M` events). */
  ts?: number;
  /** Microseconds; `X` only. */
  dur?: number;
  pid: number;
  tid?: number;
  /** Instant scope: `t` (thread) — the only one emitted. */
  s?: 't';
  args?: Record<string, unknown>;
}

export interface TraceMetadata {
  runId?: string;
  /** Never empty: Perfetto's postMessage contract rejects a non-string title silently. */
  title: string;
  /** The number of lines the projection parsed (malformed lines skipped). */
  lines: number;
}

export interface ChromeTrace {
  traceEvents: TraceEvent[];
  metadata: TraceMetadata;
}

export interface ToChromeTraceOptions {
  runId?: string;
  /** The local hop's process name: `server` on the server, `relay` on the relay. */
  localName: string;
}

/** The two `localName` constants spec 012a mints: nothing in the log names the local hop. */
export const SERVER_LOCAL_NAME = 'server';
export const RELAY_LOCAL_NAME = 'relay';

/** The local hop's pid; foreign hops count up from here. */
export const LOCAL_PID = 1;

/** The row every hop starts with. */
export const CONNECTION_ROW = 'connection';

/** Lane N of pid P is `tid = P × 1000 + N`: no hop's lane 1 accidentally equals its pid (Perfetto marks `tid == pid` as a main thread). */
export function laneTid(pid: number, lane: number): number {
  return pid * 1000 + lane;
}

/**
 * End-line fields the trace does not repeat under `args`:
 * `durationMs` is the slice's own `dur` (the JSONL keeps it — spec 012's
 * accept file pins it there). Nothing else is filtered.
 */
const ARGS_OMITTED: readonly string[] = ['durationMs'];

const LEVELS: readonly string[] = ['error', 'warn', 'info', 'debug'];
const KINDS: readonly string[] = ['begin', 'end', 'log'];

function isWellFormed(value: unknown): value is TraceLogLine {
  if (typeof value !== 'object' || value === null) return false;
  const line = value as Partial<TraceLogLine>;
  if (typeof line.seq !== 'number' || typeof line.ts !== 'number' || !Number.isFinite(line.ts)) return false;
  if (typeof line.level !== 'string' || !LEVELS.includes(line.level)) return false;
  if (typeof line.kind !== 'string' || !KINDS.includes(line.kind)) return false;
  const node = line.node as Partial<TraceLogNode> | undefined;
  if (typeof node !== 'object' || node === null) return false;
  if (typeof node.id !== 'string' || node.id.length === 0 || typeof node.type !== 'string' || typeof node.name !== 'string') return false;
  if (node.parent !== undefined && typeof node.parent !== 'string') return false;
  if (line.fields !== undefined && (typeof line.fields !== 'object' || line.fields === null || Array.isArray(line.fields))) return false;
  if (line.msg !== undefined && typeof line.msg !== 'string') return false;
  return true;
}

/** Parses NDJSON into lines, skipping malformed ones (defense in depth: `LogStore.read` already drops them). */
export function parseTraceLines(jsonl: string): TraceLogLine[] {
  const lines: TraceLogLine[] = [];
  for (const text of jsonl.split('\n')) {
    if (text.trim().length === 0) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      continue;
    }
    if (isWellFormed(parsed)) lines.push(parsed);
  }
  return lines;
}

/**
 * The hop that owns a node id, or `undefined` for the local hop. A head
 * segment (before the first `/`) that is not server-namespaced (`conn`,
 * `rpc:…`, `step:…`) names the hop: `mac-a/rpc:7` → `mac-a`, while
 * `rpc:7/boot` (a sub-operation) is local. Known hole (spec 012a): relay
 * node names are not constrained, so a node named `a/b` or `rpc:7` is
 * misattributed; that is spec 008's surface.
 */
export function hopOf(id: string): string | undefined {
  const slash = id.indexOf('/');
  const head = slash === -1 ? id : id.slice(0, slash);
  if (head === 'conn' || head.startsWith('rpc:') || head.startsWith('step:')) return undefined;
  return head;
}

type Dict = Record<string, unknown>;

function isDict(value: unknown): value is Dict {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/** A node as the file declares it, or a synthetic one the projection adds (a device, an app). */
interface NodeRecord {
  id: string;
  begin?: TraceLogLine;
  end?: TraceLogLine;
  logs: TraceLogLine[];
  pid: number;
  /** Which row family this node belongs to (see {@link Row}). */
  row?: Row;
  /** Assigned by {@link assignLanes}; a node the file never began has none. */
  lane?: number;
  /** The interval placed on the lane, for lineage nesting (see {@link fits}). */
  interval?: Interval;
  /**
   * The synthetic span this node was filed under by its handle (the app its
   * `appHandleId` names, else the device its `allocationId` names): its
   * parent for placement when its declared parent lives on another row.
   */
  rowParent?: NodeRecord;
  /** Synthetic spans only. */
  synthetic?: SyntheticSpan;
}

type BegunNode = NodeRecord & { begin: TraceLogLine };

interface SyntheticSpan {
  name: string;
  cat: 'device' | 'app';
  parent: string;
  start: number;
  /** `Infinity` while nothing has ended it. */
  end: number;
  args: Dict;
}

/** A named family of lanes on one process: `connection`, or one per allocated device. */
interface Row {
  name: string;
  /** Process-wide lane numbers this row owns, in order: `name`, `name +1`, … */
  lanes: number[];
}

interface Process {
  pid: number;
  name: string;
  sortIndex: number;
  /** Process-wide lane → the intervals still open on it (see {@link fits}). */
  lanes: Interval[][];
  laneNames: string[];
  rows: Row[];
  connectionRow: Row;
  nodes: NodeRecord[];
  /** Every synthetic span minted, in order — a reused id has several lives, each its own row (see {@link deviceLifeAt}). */
  deviceSpans: NodeRecord[];
  appSpans: NodeRecord[];
}

/** Half-open `[start, end)`, `end = Infinity` for an unended node. */
interface Interval {
  start: number;
  end: number;
}

export function toChromeTrace(lines: TraceLogLine[], options: ToChromeTraceOptions): ChromeTrace {
  const processes = new Map<string | undefined, Process>();
  const newProcess = (hop: string | undefined): Process => {
    const connectionRow: Row = { name: CONNECTION_ROW, lanes: [] };
    const process: Process = {
      pid: LOCAL_PID + processes.size,
      name: hop ?? options.localName,
      sortIndex: processes.size,
      lanes: [],
      laneNames: [],
      rows: [connectionRow],
      connectionRow,
      nodes: [],
      deviceSpans: [],
      appSpans: [],
    };
    processes.set(hop, process);
    return process;
  };
  newProcess(undefined);
  const processOf = (id: string): Process => {
    const hop = hopOf(id);
    return processes.get(hop) ?? newProcess(hop);
  };

  // Pass 1: nodes, in file order (`seq` decides begin/end, never `ts`).
  const nodes = new Map<string, NodeRecord>();
  const recordOf = (id: string): NodeRecord => {
    let record = nodes.get(id);
    if (!record) {
      const process = processOf(id);
      record = { id, logs: [], pid: process.pid };
      nodes.set(id, record);
      process.nodes.push(record);
    }
    return record;
  };
  for (const line of lines) {
    if (line.kind === 'end') {
      // An end for a node that never began is dropped whole: no record, and
      // no process minted for a hop the file otherwise never names.
      const record = nodes.get(line.node.id);
      if (record?.begin && !record.end) record.end = line;
      continue;
    }
    const record = recordOf(line.node.id);
    if (line.kind === 'begin') {
      if (!record.begin) record.begin = line;
    } else {
      record.logs.push(line);
    }
  }

  // Pass 2: the synthetic device and app spans, every node's row, then lanes.
  for (const process of processes.values()) {
    synthesizeSpans(process, nodes);
    assignRows(process, nodes);
    assignLanes(process, nodes);
    if (process.lanes.length === 0) openLane(process, process.connectionRow);
  }

  // Pass 3: events.
  const events: TraceEvent[] = [];
  for (const process of processes.values()) {
    events.push(
      { name: 'process_name', ph: 'M', pid: process.pid, args: { name: process.name } },
      { name: 'process_sort_index', ph: 'M', pid: process.pid, args: { sort_index: process.sortIndex } },
    );
    process.laneNames.forEach((name, index) => {
      const lane = index + 1;
      const tid = laneTid(process.pid, lane);
      events.push(
        { name: 'thread_name', ph: 'M', pid: process.pid, tid, args: { name } },
        { name: 'thread_sort_index', ph: 'M', pid: process.pid, tid, args: { sort_index: lane } },
      );
    });
  }

  interface Timed {
    event: TraceEvent;
    seq: number;
  }
  const timed: Timed[] = [];
  for (const record of nodes.values()) {
    const tid = laneTid(record.pid, record.lane ?? 1);
    const { begin, end, synthetic } = record;
    if (synthetic) {
      const detox: Dict = { id: record.id, parent: synthetic.parent, synthetic: true };
      const base = { name: synthetic.name, cat: synthetic.cat, pid: record.pid, tid, args: { ...synthetic.args, detox } };
      timed.push({
        seq: 0,
        event:
          synthetic.end === Infinity
            ? { ...base, ph: 'B', ts: micros(synthetic.start) }
            : { ...base, ph: 'X', ts: micros(synthetic.start), dur: micros(synthetic.end - synthetic.start) },
      });
      continue;
    }
    if (begin) {
      const detox: Dict = { id: record.id, level: (end ?? begin).level, beginSeq: begin.seq };
      if (begin.node.parent !== undefined) detox.parent = begin.node.parent;
      const name = nameOf(begin, end);
      if (end) {
        detox.endSeq = end.seq;
        const raw = end.ts - begin.ts;
        // A wall clock can step backwards (NTP), and a relay's merged file
        // interleaves two hops' clocks verbatim; Perfetto drops a negative
        // duration outright, which for `conn` would erase the connection.
        // The clamp is the one alteration the projection makes, never silent.
        if (raw < 0) detox.clockWentBackwards = true;
        timed.push({
          seq: begin.seq,
          event: {
            name,
            cat: begin.node.type,
            ph: 'X',
            ts: micros(begin.ts),
            dur: micros(Math.max(0, raw)),
            pid: record.pid,
            tid,
            // `detox` is spread last: a 012 field named `detox` must not clobber the namespace.
            args: { ...argsOf(begin.fields), ...argsOf(end.fields), ...(end.msg !== undefined ? { endMsg: end.msg } : {}), detox },
          },
        });
      } else {
        timed.push({
          seq: begin.seq,
          event: { name, cat: begin.node.type, ph: 'B', ts: micros(begin.ts), pid: record.pid, tid, args: { ...argsOf(begin.fields), detox } },
        });
      }
    }
    // A `log` under a node the file never began lands on the process's lane 1.
    for (const line of record.logs) {
      timed.push({
        seq: line.seq,
        event: {
          name: line.msg ?? line.node.name,
          cat: line.node.type,
          ph: 'i',
          s: 't',
          ts: micros(line.ts),
          pid: record.pid,
          tid,
          args: { ...line.fields, detox: { id: record.id, level: line.level, seq: line.seq } },
        },
      });
    }
  }
  // Drawing order only: by `ts`, slices before ticks at equal `ts`, file order otherwise.
  timed.sort((a, b) => (a.event.ts ?? 0) - (b.event.ts ?? 0) || phaseRank(a.event.ph) - phaseRank(b.event.ph) || a.seq - b.seq);
  events.push(...timed.map((t) => t.event));

  return {
    traceEvents: events,
    metadata: {
      ...(options.runId !== undefined ? { runId: options.runId } : {}),
      title: options.runId !== undefined ? `detox run ${options.runId}` : 'detox run',
      lines: lines.length,
    },
  };
}

function argsOf(fields: Dict | undefined): Dict {
  if (!fields) return {};
  const out: Dict = {};
  for (const [key, value] of Object.entries(fields)) if (!ARGS_OMITTED.includes(key)) out[key] = value;
  return out;
}

/**
 * The slice name: human for an rpc (from `method` + `params`) and for the
 * connection (from its fields); the node's own name otherwise. A node that
 * ended `ok: false` wears a ` ✗` (and the wire error code when there is
 * one) so a failure is visible on the flame chart without clicking, instead
 * of a failed rpc looking exactly like a passing one. Shared with the text
 * views (spec 013): the outline and Perfetto must never disagree on a name.
 */
export function describeNode(begin: TraceLogLine, end?: TraceLogLine): string {
  return nameOf(begin, end);
}

function nameOf(begin: TraceLogLine, end?: TraceLogLine): string {
  const { node, fields } = begin;
  let name = node.name;
  const method = node.type === 'rpc' ? str(fields?.method) : undefined;
  if (node.type === 'rpc' && fields !== undefined) {
    // A request is named from its method and params; a sub-operation
    // carries `op`, not `method`: a spawned child from its argv (spec 013),
    // a progress child (`boot`) keeps its own name.
    if (method !== undefined) name = describeRpc(method, fields.params);
    else name = describeSpawn(fields, node.name);
  }
  if (node.type === 'server' && (node.id === 'conn' || node.id.endsWith('/conn'))) name = describeConnection(fields, node.name);
  return `${name}${describeOutcome(method, end?.fields)}`;
}

function micros(ms: number): number {
  return Math.round(ms * 1000);
}

function phaseRank(ph: TraceEventPhase): number {
  return ph === 'i' ? 1 : 0;
}

/** A local id in this hop's namespace: `conn` → `mac-a/conn` on a foreign hop, unchanged on the local one. */
function withHop(process: Process, localId: string): string {
  return process.pid === LOCAL_PID ? localId : `${process.name}/${localId}`;
}

/**
 * A device span per successful `allocateDevice` (its end line
 * carries `result.allocationId`/`udid`/`name`, spec 012), from
 * the allocation's begin to the end of the `releaseDevice` that names it,
 * else the connection's end, else open; an app span per successful
 * `launchApp` (`result.appHandleId`/`pid`), from the launch's begin to the
 * end of the `terminateApp` naming that handle, else its device's end.
 */
function synthesizeSpans(process: Process, all: Map<string, NodeRecord>): void {
  const connId = withHop(process, 'conn');
  const conn = all.get(connId);
  const connEnd = conn?.end?.ts ?? Infinity;
  const begunRpcs = process.nodes.filter((n): n is BegunNode => n.begin !== undefined && n.begin.node.type === 'rpc');
  const paramsOf = (n: BegunNode): Dict | undefined => (isDict(n.begin.fields?.params) ? n.begin.fields.params : undefined);
  const resultOf = (n: BegunNode): Dict | undefined => (isDict(n.end?.fields?.result) ? n.end.fields.result : undefined);
  const methodOf = (n: BegunNode): string | undefined => str(n.begin.fields?.method);

  const mint = (id: string, span: SyntheticSpan): NodeRecord => {
    const record: NodeRecord = { id, logs: [], pid: process.pid, synthetic: span };
    all.set(id, record);
    process.nodes.push(record);
    return record;
  };

  for (const rpc of begunRpcs) {
    if (methodOf(rpc) !== 'allocateDevice') continue;
    const result = resultOf(rpc);
    const allocationId = str(result?.allocationId);
    if (result === undefined || allocationId === undefined) continue;
    // The first release naming the id AFTER this allocation began — the id may have had an earlier life.
    const release = begunRpcs.find((n) => methodOf(n) === 'releaseDevice' && str(paramsOf(n)?.allocationId) === allocationId && n.end !== undefined && n.begin.seq > rpc.begin.seq);
    const end = release?.end?.ts ?? connEnd;
    // `alloc-N` is a node-side counter that a later allocation on the same
    // connection may reuse after a release; the id carries the minting
    // request's seq so two lives of one id never merge, and the map holds
    // the latest — later rpcs naming the id belong to the current life.
    const device = mint(withHop(process, `device:${allocationId}#${String(rpc.begin.seq)}`), {
      name: describeDevice(result),
      cat: 'device',
      parent: connId,
      start: rpc.begin.ts,
      end: Math.max(rpc.begin.ts, end),
      args: { allocationId, ...result },
    });
    process.deviceSpans.push(device);
  }

  for (const rpc of begunRpcs) {
    if (methodOf(rpc) !== 'launchApp') continue;
    const result = resultOf(rpc);
    const appHandleId = str(result?.appHandleId);
    const allocationId = str(paramsOf(rpc)?.allocationId);
    const device = allocationId === undefined ? undefined : deviceLifeAt(process, allocationId, rpc.begin.ts);
    if (result === undefined || appHandleId === undefined || device?.synthetic === undefined) continue;
    const terminate = begunRpcs.find((n) => methodOf(n) === 'terminateApp' && str(paramsOf(n)?.appHandleId) === appHandleId && n.end !== undefined && n.begin.seq > rpc.begin.seq);
    const end = terminate?.end?.ts ?? device.synthetic.end;
    const app = mint(withHop(process, `app:${appHandleId}#${String(rpc.begin.seq)}`), {
      name: describeApp(str(paramsOf(rpc)?.appId), result),
      cat: 'app',
      parent: device.id,
      start: rpc.begin.ts,
      end: Math.max(rpc.begin.ts, Math.min(end, device.synthetic.end)),
      args: { appHandleId, ...(allocationId !== undefined ? { allocationId } : {}), ...result },
    });
    process.appSpans.push(app);
  }
}

/**
 * Every node's row: a synthetic device span owns its row, an app span joins
 * its device's; an rpc joins the row of the app its `params.appHandleId`
 * names, else of the device its `params.allocationId` names — the
 * `allocateDevice` and `launchApp` that minted them included (their handle
 * is in `result`); a sub-operation follows its request; everything else
 * (the connection, steps, orphans) is the connection row.
 */
function assignRows(process: Process, all: Map<string, NodeRecord>): void {
  const rowOfDevice = new Map<NodeRecord, Row>();
  for (const device of process.deviceSpans) {
    const row: Row = { name: device.synthetic?.name ?? 'device', lanes: [] };
    process.rows.push(row);
    rowOfDevice.set(device, row);
    device.row = row;
  }
  for (const app of process.appSpans) {
    const device = all.get(app.synthetic?.parent ?? '');
    app.row = (device && rowOfDevice.get(device)) ?? process.connectionRow;
  }
  const ownerOfRpc = (node: NodeRecord): NodeRecord | undefined => {
    const fields = node.begin?.fields;
    const params = isDict(fields?.params) ? fields.params : undefined;
    const result = isDict(node.end?.fields?.result) ? node.end.fields.result : undefined;
    const ts = node.begin?.ts ?? 0;
    const appHandleId = str(params?.appHandleId) ?? str(result?.appHandleId);
    if (appHandleId !== undefined) {
      const app = appLifeAt(process, appHandleId, ts);
      if (app?.row) return app;
    }
    const allocationId = str(params?.allocationId) ?? str(result?.allocationId);
    if (allocationId !== undefined) return deviceLifeAt(process, allocationId, ts);
    return undefined;
  };
  // File order puts a request before its sub-operations, so a child can follow its parent's row.
  for (const node of process.nodes) {
    if (node.row !== undefined || node.begin === undefined) continue;
    if (node.begin.node.type === 'rpc') {
      const owner = ownerOfRpc(node);
      if (owner?.row) {
        node.row = owner.row;
        node.rowParent = owner;
        continue;
      }
      const parent = node.begin.node.parent === undefined ? undefined : all.get(node.begin.node.parent);
      if (parent?.row !== undefined && parent.pid === process.pid && str(node.begin.fields?.op) !== undefined) {
        node.row = parent.row;
        node.rowParent = parent.rowParent;
        continue;
      }
    }
    node.row = process.connectionRow;
  }
  for (const node of process.nodes) if (node.row === undefined) node.row = process.connectionRow;
}

/** The life of `allocationId` that was current at `ts`: the latest device span with that id begun no later than `ts`. */
function deviceLifeAt(process: Process, allocationId: string, ts: number): NodeRecord | undefined {
  let found: NodeRecord | undefined;
  for (const device of process.deviceSpans) {
    if (device.synthetic?.args.allocationId === allocationId && device.synthetic.start <= ts) found = device;
  }
  return found;
}

/** The life of `appHandleId` current at `ts` (handles are UUIDs, so one life is the norm; the rule is the same). */
function appLifeAt(process: Process, appHandleId: string, ts: number): NodeRecord | undefined {
  let found: NodeRecord | undefined;
  for (const app of process.appSpans) {
    if (app.synthetic?.args.appHandleId === appHandleId && app.synthetic.start <= ts) found = app;
  }
  return found;
}

function openLane(process: Process, row: Row): number {
  process.lanes.push([]);
  const lane = process.lanes.length;
  row.lanes.push(lane);
  process.laneNames.push(row.lanes.length === 1 ? row.name : `${row.name} +${String(row.lanes.length - 1)}`);
  return lane;
}

/**
 * The lane rule, per row. Within a row, begun nodes are placed in
 * topological order over `node.parent` first (a parent is always placed
 * before its child; a parent the file never began, or one on another hop
 * or row, counts as absent), and within that by (start `ts`, longer first,
 * `seq`). Intervals are half-open, `[begin.ts, end.ts)` — Perfetto's own
 * convention — so a slice ending in the millisecond the next begins is
 * disjoint from it; an unended node's interval is `[begin.ts, +∞)`; a
 * zero-length interval is empty.
 *
 * A node fits a lane when its interval is disjoint from every interval on
 * that lane or wholly inside one (nesting is transitive, so "inside the
 * innermost open at its start" is the same test). An unended interval
 * contains nothing and is contained by nothing, so an unended node takes a
 * lane where nothing is open and nothing is ever placed after it there
 * (Perfetto's `misplaced_end_event` truncation cannot occur). An empty
 * interval fits nothing and overlaps nothing: it takes its parent's lane, or
 * the row's first lane without one. Otherwise a node tries its parent's
 * lane first, then the row's lowest-numbered lane it fits, else a new lane
 * of the row (`<row> +N`) — a child that outlives its parent (a step ended
 * before its RPC, which 012 permits) is promoted rather than drawn
 * overlapping, `args.detox.parent` keeping the lineage.
 */
function assignLanes(process: Process, all: Map<string, NodeRecord>): void {
  const intervalOf = (node: NodeRecord): Interval => {
    if (node.synthetic) return { start: node.synthetic.start, end: node.synthetic.end };
    const begin = node.begin as TraceLogLine;
    return { start: begin.ts, end: node.end ? Math.max(begin.ts, node.end.ts) : Infinity };
  };
  const seqOf = (node: NodeRecord): number => node.begin?.seq ?? 0;
  const parentIdOf = (node: NodeRecord): string | undefined => node.synthetic?.parent ?? node.begin?.node.parent;

  for (const row of process.rows) {
    const members = process.nodes.filter((n) => n.row === row && (n.begin !== undefined || n.synthetic !== undefined));
    // Ascending start, longer first, then file order. A parent contains its
    // child, so it sorts no later than the child; the topological pull-forward
    // below only matters for a parent the sort could not see (equal keys).
    const ordered = [...members].sort((a, b) => {
      const ia = intervalOf(a);
      const ib = intervalOf(b);
      return ia.start - ib.start || (ib.end === ia.end ? 0 : ib.end - ia.end) || seqOf(a) - seqOf(b);
    });

    // The declared parent when it lives on this row; else the synthetic span
    // the node was filed under by its handle (a request under its app or
    // device, whose declared parent is a step on the connection row).
    const placedParent = (node: NodeRecord): NodeRecord | undefined => {
      const parentId = parentIdOf(node);
      const parent = parentId === undefined ? undefined : all.get(parentId);
      if (parent && parent.row === row && (parent.begin !== undefined || parent.synthetic !== undefined)) return parent;
      return node.rowParent?.row === row ? node.rowParent : undefined;
    };

    const placeOne = (node: NodeRecord, parent: NodeRecord | undefined): void => {
      const interval = intervalOf(node);
      if (row.lanes.length === 0) openLane(process, row);
      if (interval.start === interval.end) {
        node.lane = parent?.lane ?? row.lanes[0];
        return;
      }
      const candidates: number[] = [];
      if (parent?.lane !== undefined) candidates.push(parent.lane);
      candidates.push(...row.lanes);
      let chosen = candidates.find((lane) => fits(process.lanes[lane - 1], interval, parent?.interval));
      if (chosen === undefined) chosen = openLane(process, row);
      process.lanes[chosen - 1].push(interval);
      node.lane = chosen;
      node.interval = interval;
    };

    // Iterative, with a visited set: a parent chain is walked to its root and
    // placed top-down, so a file's nesting depth is not the stack's, and a
    // cycle the server would never write (parents are server-minted) is
    // broken rather than recursed into — the node at the cycle counts as a root.
    const place = (node: NodeRecord): void => {
      if (node.lane !== undefined) return;
      let chain: NodeRecord[] = [];
      const seen = new Set<NodeRecord>();
      let current: NodeRecord | undefined = node;
      while (current !== undefined && current.lane === undefined) {
        if (seen.has(current)) {
          chain = [node];
          break;
        }
        seen.add(current);
        chain.push(current);
        current = placedParent(current);
      }
      for (let i = chain.length - 1; i >= 0; i--) {
        const parent = placedParent(chain[i]);
        placeOne(chain[i], parent?.lane === undefined ? undefined : parent);
      }
    };
    for (const node of ordered) place(node);
  }
}

/**
 * Whether `candidate` fits a lane, given that nodes are placed in ascending
 * start order: every interval still open at `candidate.start` began no later
 * than it, and open intervals nest, so the innermost open one decides — the
 * candidate fits when it is wholly inside it, or when nothing is open.
 * Intervals closed before `candidate.start` are retired from the lane as
 * they are passed (no later candidate can overlap them), which keeps one
 * placement O(1) amortized per lane instead of a scan of the lane's history.
 *
 * Lineage nesting: when the innermost open interval is the candidate's own
 * parent, the candidate fits even if that parent is unended — a live
 * connection or device keeps drawing its children inside itself (the
 * "nothing after an unended node" rule guards against false parentage,
 * and a declared child is not false).
 */
function fits(lane: Interval[], candidate: Interval, parent?: Interval): boolean {
  while (lane.length > 0 && lane[lane.length - 1].end <= candidate.start) lane.pop();
  if (lane.length === 0) return true;
  const innermost = lane[lane.length - 1];
  if (parent !== undefined && innermost === parent) return innermost.start <= candidate.start && candidate.end <= innermost.end;
  return contains(innermost, candidate);
}

/** `outer` wholly holds `inner`; an unended interval never does. */
function contains(outer: Interval, inner: Interval): boolean {
  return outer.end !== Infinity && outer.start <= inner.start && inner.end <= outer.end;
}
