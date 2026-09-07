/**
 * One connection's recorder (spec 012): the `Peer.observe` seam turned into
 * JSONL lines, the `$/log` judge, the narration door for the server's own
 * prose, and the end-of-connection sequence — sub-operations closed at
 * socket close, requests closed as their handlers settle, every still-open
 * node closed LIFO once handlers have settled and reclaim has narrated,
 * then the `conn` node's own `end`, the last line, which closes every
 * `follow`.
 *
 * The tree is declared, never inferred: a sub-operation's parent is the
 * request that started it (the `$/progress` begin/end frames already say
 * so), a request's parent is the most recently begun still-open step at
 * the moment its frame arrived, steps nest under the same rule.
 */
import type { HandlerScope, ObservedProgress, ObservedRequestBegin, ObservedRequestEnd, PeerObserver, WireError } from '@detox-remote/core';
import { isLogKind, isLogLineLevel, isLogStatus, type LogAttrs, type LogStatus } from '@detox-remote/protocol';

import { CONN_NODE } from './LogStore';
import type { ConnectionLog, LogLineInput, LogNode } from './ConnectionLog';
import { redactValue } from './redact';
import { cutChildOutput } from './child-output';
import { serverLog, type LogLevel, type ServerLogSink } from './log-sink';
import { requestScope, type RequestTrace, type SpawnBegin, type SpawnSpan } from './request-scope';

/** Params past this are stored as a string prefix with `paramsTruncated: true`. */
export const PARAMS_CAP_BYTES = 16 * 1024;

/** `--child-output-budget`: bytes of a child's captured output stored per stream (spec 013). */
export const DEFAULT_CHILD_OUTPUT_BUDGET_BYTES = 64 * 1024;

/** The door the server's handlers narrate through: a line under the request the signal belongs to, else under `conn`. */
export interface ConnectionTrace {
  narrate(signal: AbortSignal | undefined, level: LogLevel, msg: string): void;
}

interface LineArgs {
  level: LogLevel;
  msg: string;
  fields?: Record<string, unknown>;
}

interface BeginArgs {
  node: LogNode;
  fields: Record<string, unknown>;
  msg?: string;
  op?: string;
  method?: string;
}

interface EndArgs {
  ok: boolean;
  fields: Record<string, unknown>;
  level: LogLevel;
  msg?: string;
}

export interface AttrsRejected {
  attrsRejected: true;
}

export interface JudgedLogError {
  name: string;
  message: string;
}

/** The `$/log` frame before the server has judged it. */
interface RawLogFrame {
  id?: unknown;
  phase?: unknown;
  kind?: unknown;
  name?: unknown;
  attrs?: unknown;
  parent?: unknown;
  step?: unknown;
  status?: unknown;
  error?: unknown;
  level?: unknown;
  msg?: unknown;
  fields?: unknown;
}

/** A child's captured stream, on its way into the file. */
interface StoredStream {
  childId: string;
  tool: string;
  stream: 'stdout' | 'stderr';
  text: string;
}

interface OpenNode {
  node: LogNode;
  startedAt: number;
  open: boolean;
  /** For sub-operations: the `op` word the progress frames use. */
  op?: string;
  /** For requests: the method, so root narration can be told from a child's. */
  method?: string;
  /** For requests: how many children of each tool it has spawned (`rpc:N/simctl`, `rpc:N/simctl#2`). */
  spawns?: Map<string, number>;
}

interface ProgressFrame {
  op: string;
  kind: 'begin' | 'progress' | 'end';
  message?: string;
  ok?: boolean;
}

export interface ConnectionRecorderDeps {
  runId: string;
  log: ConnectionLog;
  remoteAddress?: string;
  sink?: ServerLogSink;
  /** Called once the `conn` end is written — the store freezes the row and closes the file. */
  onEnded: () => void;
  /** Bytes of a child process's captured output stored per stream (spec 013); default 64 KiB. */
  childOutputBudgetBytes?: number;
}

export class ConnectionRecorder implements PeerObserver, ConnectionTrace {
  readonly runId: string;
  readonly #log: ConnectionLog;
  readonly #sink: ServerLogSink;
  readonly #onEnded: () => void;
  readonly #nodes = new Map<string, OpenNode>();
  /** Begin order, for the LIFO close at the end. */
  readonly #order: string[] = [];
  readonly #openSteps: string[] = [];
  readonly #running = new Set<string>();
  readonly #bySignal = new WeakMap<AbortSignal, string>();
  readonly #startedAt = Date.now();
  readonly #short: string;
  readonly #childOutputBudgetBytes: number;
  #socketClosed = false;
  #reclaimed = false;
  #finished = false;
  #resolveEnded!: () => void;
  readonly #ended = new Promise<void>((resolve) => {
    this.#resolveEnded = resolve;
  });

  /**
   * The peer's handler scope (spec 013): every handler runs inside its
   * request's trace, so a child process spawned three modules down — or a
   * line written after the answer went out — lands under the request.
   */
  readonly handlerScope: HandlerScope = (info, run) => requestScope.run(this.#traceFor(`rpc:${info.id}`), run);

  constructor({ runId, log, remoteAddress, sink = serverLog, onEnded, childOutputBudgetBytes = DEFAULT_CHILD_OUTPUT_BUDGET_BYTES }: ConnectionRecorderDeps) {
    this.runId = runId;
    this.#log = log;
    this.#sink = sink;
    this.#onEnded = onEnded;
    this.#childOutputBudgetBytes = childOutputBudgetBytes;
    this.#short = runId.slice(0, 8);
    this.#write(
      { level: 'info', kind: 'begin', node: { ...CONN_NODE }, fields: { runId, ...(remoteAddress ? { remoteAddress } : {}) } },
      false,
      `connection ${runId} opened${remoteAddress ? ` from ${remoteAddress}` : ''}`,
    );
  }

  /** Resolves once the `conn` end is on disk. */
  get ended(): Promise<void> {
    return this.#ended;
  }

  get openHandlers(): number {
    return this.#running.size;
  }

  // ── the Peer.observe seam ────────────────────────────────────────────────

  onRequestBegin({ id, method, params, signal, step }: ObservedRequestBegin): void {
    const nodeId = `rpc:${id}`;
    // The frame's own `step` (spec 013) when it names an open step; else
    // the open-step rule — right for sequential runs, and all an older
    // client offers.
    const declared = typeof step === 'string' ? `step:${step}` : undefined;
    const parent = declared !== undefined && this.#nodes.get(declared)?.open ? declared : this.#openSteps.at(-1);
    this.#running.add(id);
    this.#bySignal.set(signal, nodeId);
    this.#begin({
      node: { id: nodeId, type: 'rpc', name: method, ...(parent ? { parent } : {}) },
      method,
      fields: { method, ...serializeParams(params) },
    });
    if (declared !== undefined && parent !== declared) {
      this.#log_(nodeId, { level: 'debug', msg: `step ${String(step)} is not open — parented by the open-step rule`, fields: { step } });
    }
  }

  onProgress({ id, value }: ObservedProgress): void {
    const requestId = `rpc:${id}`;
    const request = this.#nodes.get(requestId);
    if (!request) return;
    if (!isProgressFrame(value)) {
      this.#log_(requestId, { level: 'debug', msg: 'progress', fields: { value } });
      return;
    }
    const childId = `${requestId}/${value.op}`;
    const child = this.#nodes.get(childId);
    if (value.kind === 'begin') {
      if (child?.open) {
        this.#log_(childId, { level: 'debug', msg: value.message ?? `${value.op} began again` });
        return;
      }
      this.#begin({ node: { id: childId, type: 'rpc', name: value.op, parent: requestId }, op: value.op, fields: { op: value.op }, msg: value.message });
      return;
    }
    if (value.kind === 'end') {
      if (!child || !child.open) {
        this.#log_(requestId, { level: 'debug', msg: `late end of ${value.op} dropped — the node already ended`, fields: { op: value.op, late: 'end' } });
        return;
      }
      const ok = value.ok !== false;
      this.#end(childId, { ok, fields: { ok }, level: ok ? 'info' : 'error', msg: value.message });
      return;
    }
    const target = value.op === request.method ? requestId : child?.open ? childId : requestId;
    this.#log_(target, { level: 'debug', msg: value.message ?? value.op, fields: value.message === undefined ? { op: value.op } : undefined });
  }

  onRequestEnd({ id, method, ok, error, result, durationMs }: ObservedRequestEnd): void {
    const nodeId = `rpc:${id}`;
    this.#running.delete(id);
    const node = this.#nodes.get(nodeId);
    if (node?.open) {
      // Children a handler left open close with it, child before parent.
      for (const childId of [...this.#order].reverse()) {
        const child = this.#nodes.get(childId);
        if (child?.open && child.node.parent === nodeId) this.#synthesize(childId, this.#socketClosed);
      }
      const torn = this.#socketClosed;
      const fields: Record<string, unknown> = { ok: torn ? false : ok, durationMs };
      if (error) fields.error = error;
      // Spec 012: the handles a result minted ride the
      // end line, so a consumer (the Perfetto projection) can name what an
      // allocation or a launch produced without scraping narration.
      const summary = ok && !torn ? summarizeResult(method, result) : undefined;
      if (summary) fields.result = summary;
      if (torn) fields.reason = 'connection-closed';
      this.#end(nodeId, { ok: fields.ok === true, fields, level: torn ? 'warn' : ok ? 'info' : levelOfError(error) });
    } else {
      this.#log_(nodeId, { level: 'debug', msg: 'late end dropped — the node already ended', fields: { late: 'end' } });
    }
    this.#maybeFinish();
  }

  // ── $/log ────────────────────────────────────────────────────────────────

  onLog(params: unknown): void {
    const frame = params as RawLogFrame | null;
    if (frame?.phase === 'log') {
      // One line under the step the frame names when it is open (spec 013),
      // else the open step (else `conn`); level and msg judged, fields verbatim.
      const level: LogLevel = isLogLineLevel(frame.level) ? frame.level : 'info';
      const msg = typeof frame.msg === 'string' ? frame.msg : '';
      const fields = judgeFields(frame.fields);
      const declared = typeof frame.step === 'string' ? `step:${frame.step}` : undefined;
      const under = declared !== undefined && this.#nodes.get(declared)?.open ? declared : (this.#openSteps.at(-1) ?? CONN_NODE.id);
      this.#log_(under, { level, msg, ...(fields !== undefined ? { fields } : {}) });
      return;
    }
    const id = typeof frame?.id === 'string' ? frame.id : undefined;
    if (id === undefined || (frame?.phase !== 'begin' && frame?.phase !== 'end')) {
      this.#log_(CONN_NODE.id, { level: 'warn', msg: 'malformed $/log dropped', fields: { rejected: 'step', ...(id !== undefined ? { id } : {}) } });
      return;
    }
    const nodeId = `step:${id}`;
    if (frame.phase === 'begin') {
      if (!isLogKind(frame.kind)) {
        this.#log_(CONN_NODE.id, {
          level: 'warn',
          msg: `step ${id} refused: unknown kind ${JSON.stringify(frame.kind)}`,
          fields: { rejected: 'step', kind: frame.kind, id },
        });
        return;
      }
      if (this.#nodes.has(nodeId)) {
        this.#log_(CONN_NODE.id, {
          level: 'warn',
          msg: `step ${id} refused: the id was already used on this connection`,
          fields: { rejected: 'step', kind: frame.kind, id },
        });
        return;
      }
      const name = typeof frame.name === 'string' ? frame.name : id;
      // An explicit parent (spec 013) must name an open step; otherwise the
      // step still exists — under the connection, refused at warn — because
      // a tree with a hole is worse than a step in the wrong place.
      let parent: string | undefined;
      if (frame.parent !== undefined) {
        const declared = typeof frame.parent === 'string' ? `step:${frame.parent}` : undefined;
        if (declared !== undefined && this.#nodes.get(declared)?.open) {
          parent = declared;
        } else {
          this.#log_(CONN_NODE.id, {
            level: 'warn',
            msg: `step ${id} parent refused: ${declared === undefined ? 'not a step id' : this.#nodes.has(declared) ? 'already ended' : 'unknown id'} — the step lands under the connection`,
            fields: { rejected: 'step-parent', id, parent: frame.parent },
          });
        }
      } else {
        parent = this.#openSteps.at(-1);
      }
      const fields: Record<string, unknown> = { kind: frame.kind };
      const attrs = judgeAttrs(frame.attrs);
      if (attrs !== undefined) fields.attrs = attrs;
      this.#openSteps.push(nodeId);
      this.#begin({ node: { id: nodeId, type: 'step', name, ...(parent ? { parent } : {}) }, fields });
      return;
    }
    const node = this.#nodes.get(nodeId);
    if (!node?.open) {
      this.#log_(CONN_NODE.id, {
        level: 'warn',
        msg: `step end for ${id} ignored: ${node ? 'already ended' : 'unknown id'}`,
        fields: { rejected: 'step-end', id },
      });
      return;
    }
    const status: LogStatus = isLogStatus(frame.status) ? frame.status : 'failed';
    const ok = status === 'passed' || status === 'skipped';
    const fields: Record<string, unknown> = { ok, status };
    const error = judgeLogError(frame.error);
    if (error) fields.error = error;
    this.#end(nodeId, { ok, fields, level: ok ? 'info' : status === 'aborted' ? 'warn' : 'error' });
  }

  // ── narration ────────────────────────────────────────────────────────────

  narrate(signal: AbortSignal | undefined, level: LogLevel, msg: string): void {
    const nodeId = (signal && this.#bySignal.get(signal)) ?? CONN_NODE.id;
    this.#log_(nodeId, { level, msg });
  }

  // ── the request trace: child processes and late lines (spec 013) ────────

  /** One request's trace: its spawns as `rpc:N/<tool>` children, its late lines under its own node. */
  #traceFor(requestId: string): RequestTrace {
    return {
      beginSpawn: (info) => this.#beginSpawn(requestId, info),
      line: (level, msg, fields) => this.#log_(requestId, { level, msg, ...(fields !== undefined ? { fields } : {}) }),
    };
  }

  #beginSpawn(requestId: string, { tool, argv, attempt }: SpawnBegin): SpawnSpan {
    // The trace is minted after `onRequestBegin`, so the request node exists.
    const request = this.#nodes.get(requestId) as OpenNode;
    const spawns = (request.spawns ??= new Map<string, number>());
    // A second spawn of the same tool in one request is `#2`, `#3`, … — a
    // retry is its own child too (`attempt` says which) — and a tool that
    // shares a progress sub-operation's name (`boot`) never overwrites it.
    let count = (spawns.get(tool) ?? 0) + 1;
    let childId = count === 1 ? `${requestId}/${tool}` : `${requestId}/${tool}#${String(count)}`;
    while (this.#nodes.has(childId)) {
      count += 1;
      childId = `${requestId}/${tool}#${String(count)}`;
    }
    spawns.set(tool, count);
    this.#begin({
      node: { id: childId, type: 'rpc', name: tool, parent: requestId },
      op: tool,
      // argv as the exec seam already redacted it; the child's env is never logged.
      fields: { op: tool, argv: [...argv], attempt },
    });
    return {
      end: ({ ok, exitCode, signal, error, stdout, stderr }) => {
        // A listing is a result, not a message: a healthy child's streams
        // are stored only when the server runs at debug; a failed child's
        // always — that is when "what did simctl say" gets asked.
        if (!ok || this.#sink.level === 'debug') {
          this.#storeStream({ childId, tool, stream: 'stdout', text: stdout });
          this.#storeStream({ childId, tool, stream: 'stderr', text: stderr });
        }
        const fields: Record<string, unknown> = { ok };
        if (exitCode !== undefined) fields.exitCode = exitCode;
        if (signal !== undefined) fields.signal = signal;
        if (error !== undefined) fields.error = error;
        fields.attempt = attempt;
        this.#end(childId, { ok, fields, level: ok ? 'info' : 'warn' });
      },
    };
  }

  /** One `log` line per output line under the child, numbered from 1, within the per-stream budget (`child-output.ts`). */
  #storeStream({ childId, tool, stream, text }: StoredStream): void {
    const { lines, truncated } = cutChildOutput(text, this.#childOutputBudgetBytes);
    lines.forEach((msg, index) => this.#log_(childId, { level: 'debug', msg, fields: { stream, line: index + 1 } }));
    if (truncated) this.#log_(childId, { level: 'warn', msg: `${tool} output truncated`, fields: { budget: 'exhausted', stream } });
  }

  // ── the end of a connection ──────────────────────────────────────────────

  /**
   * The socket is gone. Sub-operations still open are closed now, LIFO,
   * with `reason: 'connection-closed'` — before their handlers' own late
   * ends can arrive (those are dropped at debug). Requests close as their
   * handlers settle; everything else waits for {@link reclaimed}.
   */
  socketClosed(): void {
    if (this.#socketClosed) return;
    this.#socketClosed = true;
    for (const nodeId of [...this.#order].reverse()) {
      const node = this.#nodes.get(nodeId);
      if (node?.open && node.op !== undefined) this.#synthesize(nodeId, true);
    }
    this.#maybeFinish();
  }

  /** Reclaim of registered allocations has narrated (or there was nothing to reclaim). */
  reclaimed(): void {
    this.#reclaimed = true;
    this.#maybeFinish();
  }

  #maybeFinish(): void {
    if (this.#finished || !this.#socketClosed || !this.#reclaimed || this.#running.size > 0) return;
    this.#finished = true;
    for (const nodeId of [...this.#order].reverse()) {
      if (this.#nodes.get(nodeId)?.open) this.#synthesize(nodeId, true);
    }
    const fields: Record<string, unknown> = { ok: true, durationMs: Date.now() - this.#startedAt, openHandlers: 0 };
    if (this.#log.exhausted) fields.budgetExhausted = true;
    this.#write({ level: 'info', kind: 'end', node: { ...CONN_NODE }, fields }, true, `connection ${this.runId} ended`);
    this.#onEnded();
    this.#resolveEnded();
  }

  // ── lines ────────────────────────────────────────────────────────────────

  #begin({ node, fields, msg, op, method }: BeginArgs): void {
    this.#nodes.set(node.id, { node, startedAt: Date.now(), open: true, op, method });
    this.#order.push(node.id);
    this.#write({ level: 'info', kind: 'begin', node, ...(msg !== undefined ? { msg } : {}), fields }, false, `${node.name} began`);
  }

  #end(nodeId: string, { ok, fields, level, msg }: EndArgs): void {
    const entry = this.#nodes.get(nodeId);
    if (!entry?.open) return;
    entry.open = false;
    if (entry.node.type === 'step') {
      const at = this.#openSteps.indexOf(nodeId);
      if (at !== -1) this.#openSteps.splice(at, 1);
    }
    const durationMs = Date.now() - entry.startedAt;
    // The "<name> ended after Nms" prose is stdout's, composed from what the
    // line already carries (spec 012: not stored twice). A caller's
    // own message (a progress frame's, a synthesized close's) is stored.
    this.#write(
      { level, kind: 'end', node: entry.node, ...(msg !== undefined ? { msg } : {}), fields: { durationMs, ...fields } },
      false,
      `${entry.node.name} ${ok ? 'ended' : 'failed'} after ${String(durationMs)}ms`,
    );
  }

  /** The server's own account of a node nobody ended. */
  #synthesize(nodeId: string, connectionClosed: boolean): void {
    const entry = this.#nodes.get(nodeId);
    if (!entry?.open) return;
    const fields: Record<string, unknown> = { ok: false };
    if (entry.node.type === 'step') fields.status = 'aborted';
    if (connectionClosed) fields.reason = 'connection-closed';
    this.#end(nodeId, { ok: false, fields, level: 'warn', msg: `${entry.node.name} was still open when the connection closed` });
  }

  #log_(nodeId: string, { level, msg, fields }: LineArgs): void {
    const node = nodeId === CONN_NODE.id ? { ...CONN_NODE } : this.#nodes.get(nodeId)?.node;
    if (!node) return;
    this.#write({ level, kind: 'log', node, msg, ...(fields ? { fields } : {}) });
  }

  #write(line: LogLineInput, force = false, prose = line.msg ?? ''): void {
    const written = this.#log.append(line, force);
    if (written) this.#sink.echo(written.level, `[${this.#short}] ${line.node.id} ${line.kind}: ${prose}`, written.ts);
  }
}

interface AllocationResultShape {
  allocationId?: unknown;
  name?: unknown;
  os?: unknown;
  device?: { udid?: unknown };
}

interface LaunchResultShape {
  appHandleId?: unknown;
  pid?: unknown;
}

/**
 * What of a result is worth an end line: the handles and the human names an
 * allocation or a launch minted. Everything else (element results, listings)
 * is not summarized — the projection needs handles, not payloads.
 */
export function summarizeResult(method: string, result: unknown): Record<string, unknown> | undefined {
  if (typeof result !== 'object' || result === null) return undefined;
  if (method === 'allocateDevice') {
    const { allocationId, name, os, device } = result as AllocationResultShape;
    const summary: Record<string, unknown> = {};
    if (typeof allocationId === 'string') summary.allocationId = allocationId;
    if (typeof device?.udid === 'string') summary.udid = device.udid;
    if (typeof name === 'string') summary.name = name;
    if (typeof os === 'string') summary.os = os;
    return Object.keys(summary).length > 0 ? summary : undefined;
  }
  if (method === 'launchApp') {
    const { appHandleId, pid } = result as LaunchResultShape;
    const summary: Record<string, unknown> = {};
    if (typeof appHandleId === 'string') summary.appHandleId = appHandleId;
    if (typeof pid === 'number') summary.pid = pid;
    return Object.keys(summary).length > 0 ? summary : undefined;
  }
  return undefined;
}

function isProgressFrame(value: unknown): value is ProgressFrame {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Partial<ProgressFrame>).op === 'string' &&
    ['begin', 'progress', 'end'].includes(String((value as Partial<ProgressFrame>).kind))
  );
}

/** `warn` for a typed refusal (a registry code, or the cancellation answer), `error` otherwise. */
function levelOfError(error: WireError | undefined): LogLevel {
  if (!error) return 'error';
  const typed = (error.code >= 2000 && error.code <= 2099) || error.code === -32800;
  return typed ? 'warn' : 'error';
}

export interface SerializedParams {
  params?: unknown;
  paramsTruncated?: true;
}

export function serializeParams(params: unknown): SerializedParams {
  if (params === undefined) return {};
  const redacted = redactValue(params);
  const text = JSON.stringify(redacted) ?? 'undefined';
  if (Buffer.byteLength(text) <= PARAMS_CAP_BYTES) return { params: redacted };
  // Cut on a byte boundary, not a UTF-16 code-unit boundary: the cap is a byte
  // budget, and multibyte-heavy params must not store 3-4x it. `toString`
  // replaces any trailing incomplete character, so the prefix never ends in a
  // split surrogate.
  const prefix = Buffer.from(text, 'utf8').subarray(0, PARAMS_CAP_BYTES).toString('utf8');
  return { params: prefix, paramsTruncated: true };
}

function isScalar(value: unknown): boolean {
  return value === null || ['string', 'number', 'boolean'].includes(typeof value);
}

/** `attrs` verbatim when every value is a scalar or an array of scalars; `{ attrsRejected: true }` otherwise. */
export function judgeAttrs(attrs: unknown): LogAttrs | AttrsRejected | undefined {
  if (attrs === undefined) return undefined;
  if (typeof attrs !== 'object' || attrs === null || Array.isArray(attrs)) return { attrsRejected: true };
  for (const value of Object.values(attrs as Record<string, unknown>)) {
    if (isScalar(value)) continue;
    if (Array.isArray(value) && value.every(isScalar)) continue;
    return { attrsRejected: true };
  }
  return attrs as LogAttrs;
}

/** A client line's `fields`: a plain object verbatim (URL-shaped strings redacted), anything else `{ fieldsRejected: true }`. */
export function judgeFields(fields: unknown): Record<string, unknown> | undefined {
  if (fields === undefined) return undefined;
  if (typeof fields !== 'object' || fields === null || Array.isArray(fields)) return { fieldsRejected: true };
  return redactValue(fields) as Record<string, unknown>;
}

export function judgeLogError(error: unknown): JudgedLogError | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const { name, message } = error as Partial<Record<'name' | 'message', unknown>>;
  return { name: typeof name === 'string' ? name : 'Error', message: typeof message === 'string' ? message : '' };
}
