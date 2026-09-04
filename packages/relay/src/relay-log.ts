/**
 * The relay's own connection log (spec 008): one JSONL file per client
 * session, written through the reused `LogStore`/`ConnectionLog`
 * (spec 012's "one lane implementation, used twice" precedent — the
 * `BlobStore` reuse above is the same shape). Unlike a server connection,
 * whose tree is built from `Peer.observe`'s RPC lifecycle, the relay never
 * puts `Peer` on the data path (spec 008's binding router rule) and so has
 * no RPC lifecycle of its own to record: its own tree holds only
 * client-declared steps (`$/log`) plus the `conn` bookends. A node's own
 * request/step tree arrives pre-built over its `follow` stream and is
 * merged in verbatim under its rewritten node id — see {@link
 * rewriteForeignLine} and `log-bridge.ts`.
 *
 * The connection's own `conn` end — the last line — waits on two gates,
 * mirroring the server's own end-of-connection choreography one level up:
 * the client must be gone, AND every node stream this session ever started
 * following must have finished (naturally, or with its one `warn` line).
 * Only then is the file complete by construction.
 */
import {
  LOG_METHOD,
  isLogKind,
  isLogStatus,
  isLogLineLevel,
  type LogKind,
  type LogStatus,
} from '@detox-remote/protocol';
import {
  CONN_NODE,
  judgeAttrs,
  judgeLogError,
  type ConnectionLog,
  type LogLevel,
  type LogLine,
  type LogLineInput,
  type LogNode,
} from '@detox-remote/server';

/** The `$/log` frame before judgment — mirrors `ConnectionRecorder`'s `RawLogFrame`. */
export interface RawLogFrame {
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

interface OpenStep {
  node: LogNode;
  open: boolean;
}

interface LogUnderArgs {
  level: LogLevel;
  msg: string;
  fields?: Record<string, unknown>;
}

export interface RelayLogPort {
  /**
   * Judges one client `$/log` frame exactly as a server judges it, records
   * it in the relay's own lane, and reports whether it crossed the
   * judgment (a step's begin/end) and should therefore be forwarded
   * upstream verbatim — a refused step, or a plain `log` line (which has no
   * node of its own on any hop but this one), is never forwarded.
   */
  onClientLog(frame: RawLogFrame): boolean;
  /** Merges one already-judged line from a node's own file, id-rewritten, `ts` preserved (each hop keeps its own wall clock). */
  mergeForeignLine(nodeName: string, line: LogLine): void;
  /** The client-shaped `$/log` begin frames of every currently open step, in begin order — replayed to a freshly dialed node before its first request. */
  replayFrames(): unknown[];
  noteFollowerStarted(): void;
  noteFollowerFinished(): void;
  noteClientClosed(): void;
  /** A node's stream dropped with the node itself (spec 008): one `warn` line on the relay's own `conn`, naming it. */
  noteNodeGone(nodeName: string): void;
}

/** `id === 'conn'` stays the connection's own bookend name; anything else gets the node's name as a namespace. */
function rewriteId(nodeName: string, id: string): string {
  return id === 'conn' ? `${nodeName}/conn` : `${nodeName}/${id}`;
}

/** Pure and unit-tested on its own: `node.id`/`node.parent` rewritten `<name>/<id>`, everything else verbatim. */
export function rewriteForeignLine(nodeName: string, line: LogLine): LogLineInput {
  const node: LogNode = {
    id: rewriteId(nodeName, line.node.id),
    type: line.node.type,
    name: line.node.name,
    ...(line.node.parent !== undefined ? { parent: rewriteId(nodeName, line.node.parent) } : {}),
  };
  return {
    level: line.level,
    kind: line.kind,
    node,
    ...(line.msg !== undefined ? { msg: line.msg } : {}),
    ...(line.fields !== undefined ? { fields: line.fields } : {}),
  };
}

export interface RelayConnectionInit {
  runId: string;
  /** The tester's address, on the `conn` begin — so "which client held that device?" is answerable from the relay's own file. */
  remoteAddress?: string;
}

export class RelayConnectionLog implements RelayLogPort {
  readonly runId: string;
  readonly #log: ConnectionLog;
  readonly #steps = new Map<string, OpenStep>();
  /** Begin order — also the LIFO close order and the replay order. */
  readonly #openSteps: string[] = [];
  /** The exact client `$/log` begin frame per open step, for verbatim replay. */
  readonly #openBeginFrames = new Map<string, unknown>();
  #followersPending = 0;
  #clientClosed = false;
  #finished = false;
  #resolveEnded!: () => void;
  readonly #ended = new Promise<void>((resolve) => {
    this.#resolveEnded = resolve;
  });

  constructor(log: ConnectionLog, { runId, remoteAddress }: RelayConnectionInit) {
    this.#log = log;
    this.runId = runId;
    this.#log.append({
      level: 'info',
      kind: 'begin',
      node: { ...CONN_NODE },
      fields: { runId, ...(remoteAddress !== undefined ? { remoteAddress } : {}) },
    });
  }

  /** Resolves once the `conn` end is on disk — mirrors `ConnectionRecorder.ended`. */
  get ended(): Promise<void> {
    return this.#ended;
  }

  onClientLog(frame: RawLogFrame): boolean {
    if (this.#finished) return false;

    if (frame.phase === 'log') {
      // A plain line has no node of its own on any hop — it is the
      // client's own connection, which is this relay, so it is recorded
      // here and never forwarded (a node has no use for it).
      const level: LogLevel = isLogLineLevel(frame.level) ? frame.level : 'info';
      const msg = typeof frame.msg === 'string' ? frame.msg : '';
      const declared = typeof frame.step === 'string' ? `step:${frame.step}` : undefined;
      const under = declared !== undefined && this.#steps.get(declared)?.open ? declared : (this.#openSteps.at(-1) ?? CONN_NODE.id);
      this.#logUnder(under, { level, msg });
      return false;
    }

    const id = typeof frame.id === 'string' ? frame.id : undefined;
    if (id === undefined || (frame.phase !== 'begin' && frame.phase !== 'end')) {
      this.#logUnder(CONN_NODE.id, {
        level: 'warn',
        msg: 'malformed $/log dropped',
        fields: { rejected: 'step', ...(id !== undefined ? { id } : {}) },
      });
      return false;
    }
    const nodeId = `step:${id}`;

    if (frame.phase === 'begin') {
      return this.#beginStep(nodeId, id, frame);
    }
    return this.#endStep(nodeId, id, frame);
  }

  #beginStep(nodeId: string, id: string, frame: RawLogFrame): boolean {
    if (!isLogKind(frame.kind)) {
      this.#logUnder(CONN_NODE.id, {
        level: 'warn',
        msg: `step ${id} refused: unknown kind ${JSON.stringify(frame.kind)}`,
        fields: { rejected: 'step', kind: frame.kind, id },
      });
      return false;
    }
    if (this.#steps.has(nodeId)) {
      this.#logUnder(CONN_NODE.id, {
        level: 'warn',
        msg: `step ${id} refused: the id was already used on this connection`,
        fields: { rejected: 'step', kind: frame.kind, id },
      });
      return false;
    }
    const kind: LogKind = frame.kind;
    const name = typeof frame.name === 'string' ? frame.name : id;
    // An explicit parent (spec 013) as the server judges it: an open step,
    // else the step lands under the connection with one warn line; absent,
    // the open-step rule.
    let parent: string | undefined;
    if (frame.parent !== undefined) {
      const declared = typeof frame.parent === 'string' ? `step:${frame.parent}` : undefined;
      if (declared !== undefined && this.#steps.get(declared)?.open) {
        parent = declared;
      } else {
        this.#logUnder(CONN_NODE.id, {
          level: 'warn',
          msg: `step ${id} parent refused: ${declared === undefined ? 'not a step id' : this.#steps.has(declared) ? 'already ended' : 'unknown id'} — the step lands under the connection`,
          fields: { rejected: 'step-parent', id, parent: frame.parent },
        });
      }
    } else {
      parent = this.#openSteps.at(-1);
    }
    const attrs = judgeAttrs(frame.attrs);
    const node: LogNode = { id: nodeId, type: 'step', name, ...(parent ? { parent } : {}) };
    this.#steps.set(nodeId, { node, open: true });
    this.#openSteps.push(nodeId);
    // The full wire notification, not just its params — this is what gets
    // `channel.send()`-ed verbatim to a freshly dialed node (session.ts's
    // replay), and a bare params object is not a frame any peer parses.
    // The parent rides along: the node judges it exactly as this hop did.
    this.#openBeginFrames.set(nodeId, {
      jsonrpc: '2.0',
      method: LOG_METHOD,
      params: {
        id,
        phase: 'begin',
        kind,
        name,
        ...(frame.attrs !== undefined ? { attrs: frame.attrs } : {}),
        ...(frame.parent !== undefined ? { parent: frame.parent } : {}),
      },
    });
    this.#log.append({
      level: 'info',
      kind: 'begin',
      node,
      msg: `${name} began`,
      fields: { kind, ...(attrs !== undefined ? { attrs } : {}) },
    });
    return true;
  }

  #endStep(nodeId: string, id: string, frame: RawLogFrame): boolean {
    const step = this.#steps.get(nodeId);
    if (!step?.open) {
      this.#logUnder(CONN_NODE.id, {
        level: 'warn',
        msg: `step end for ${id} ignored: ${step ? 'already ended' : 'unknown id'}`,
        fields: { rejected: 'step-end', id },
      });
      return false;
    }
    const status: LogStatus = isLogStatus(frame.status) ? frame.status : 'failed';
    const ok = status === 'passed' || status === 'skipped';
    const error = judgeLogError(frame.error);
    step.open = false;
    const at = this.#openSteps.indexOf(nodeId);
    if (at !== -1) this.#openSteps.splice(at, 1);
    this.#openBeginFrames.delete(nodeId);
    this.#log.append({
      level: ok ? 'info' : status === 'aborted' ? 'warn' : 'error',
      kind: 'end',
      node: step.node,
      msg: `${step.node.name} ${ok ? 'ended' : 'failed'}`,
      fields: { ok, status, ...(error ? { error } : {}) },
    });
    return true;
  }

  mergeForeignLine(nodeName: string, line: LogLine): void {
    if (this.#finished) return; // followers finish before the session does; defensive only
    this.#log.append(rewriteForeignLine(nodeName, line), false, line.ts);
  }

  replayFrames(): unknown[] {
    return this.#openSteps.map((nodeId) => this.#openBeginFrames.get(nodeId)).filter((frame) => frame !== undefined);
  }

  noteFollowerStarted(): void {
    this.#followersPending += 1;
  }

  noteFollowerFinished(): void {
    this.#followersPending -= 1;
    this.#maybeFinish();
  }

  noteClientClosed(): void {
    this.#clientClosed = true;
    this.#maybeFinish();
  }

  noteNodeGone(nodeName: string): void {
    if (this.#finished) return; // the corresponding noteFollowerFinished() always follows this — defensive only
    this.#logUnder(CONN_NODE.id, {
      level: 'warn',
      msg: `connection to node "${nodeName}" was lost — its log stops here; everything it wrote before is already recorded`,
      fields: { node: nodeName },
    });
  }

  #maybeFinish(): void {
    if (this.#finished || !this.#clientClosed || this.#followersPending > 0) return;
    this.#finished = true;
    for (const nodeId of [...this.#openSteps].reverse()) {
      const step = this.#steps.get(nodeId);
      if (!step?.open) continue;
      step.open = false;
      this.#log.append({
        level: 'warn',
        kind: 'end',
        node: step.node,
        msg: `${step.node.name} was still open when the connection closed`,
        fields: { ok: false, status: 'aborted', reason: 'connection-closed' },
      });
    }
    this.#openSteps.length = 0;
    this.#openBeginFrames.clear();
    this.#log.append(
      { level: 'info', kind: 'end', node: { ...CONN_NODE }, fields: { ok: true } },
      true,
    );
    this.#resolveEnded();
  }

  #logUnder(nodeId: string, { level, msg, fields }: LogUnderArgs): void {
    const node = nodeId === CONN_NODE.id ? { ...CONN_NODE } : this.#steps.get(nodeId)?.node;
    if (!node) return;
    this.#log.append({ level, kind: 'log', node, msg, ...(fields ? { fields } : {}) });
  }
}
