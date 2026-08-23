/**
 * One client session through the relay (spec 008).
 *
 * The relay routes frames, not typed calls: never `Peer` on the data path,
 * which would refuse every future verb and run retention/undo machinery for
 * work it never did. One routing rule:
 *
 *   allocateDevice                        → sequential fan-out
 *   any request with params.allocationId  → the node that owns it
 *   $/cancelRequest                       → wherever that request id went
 *   $/progress, $/cancelAck, responses    → the client call that owns the id
 *   deviceStateChanged                    → the client, allocationId rewritten
 *
 * `allocationId` is rewritten at the relay: nodes mint colliding per-process
 * ids, so the client gets relay-minted opaque UUIDs and the relay keeps
 * relayId → (node, nodeId). The rewrite is synchronous with the forwarding
 * stream — an awaited lookup could reorder a node's push-before-answer pair.
 *
 * The relay originates no requests and mints no ids of its own on the wire:
 * every frame it synthesizes answers an id the client minted.
 */
import { randomUUID } from 'node:crypto';

import {
  DetoxConnectionError,
  DetoxErrorCode,
  DevicePoolExhaustedError,
  NoMatchingDeviceError,
  toWireError,
  type Channel,
} from '@detox-remote/core';

import type { EnsureBlobOutcome } from './blob-bridge';
import { relayError } from './log';

/** @issue DTX-7001: no frame from a node for this long abandons the attempt (tries next); any frame resets the timer. */
export const ALLOCATION_STALL_MS = 30_000;

/**
 * How many answered request ids stay routable for a late `$/cancelRequest`
 * (the node's own peer keeps a retention window for this pairing and answers
 * `$/cancelAck` itself). A count cap, not a clock — mirrors the peer's 4096
 * ceiling.
 */
const ANSWERED_RETENTION_MAX = 4096;

/**
 * Pushes for a node allocation the relay has not adopted yet (the server
 * attaches its notifier just before answering `allocateDevice`, so a state
 * change in that gap arrives before the relay knows the id). Latest state
 * per allocation, flushed just before the adopting response; the cap only
 * bounds a hostile node.
 */
const EARLY_PUSH_MAX = 256;

const SHA256_HEX_RE = /^[0-9a-f]{64}$/;

/** JSON-RPC's cancellation answer (LSP's `-32800`) — forwarded, never re-classified. */
const JSONRPC_CANCELLED = -32800;
const JSONRPC_METHOD_NOT_FOUND = -32601;
const JSONRPC_INVALID_REQUEST = -32600;

interface CloseableChannel extends Channel {
  close(): void;
}

/** What the session needs from each configured node — injectable for units. */
export interface SessionNode {
  /** Operator-chosen name (config order = fan-out order = aggregate order). */
  readonly name: string;
  /** Dials the node's command channel with the node's own credentials. */
  connect(): Promise<CloseableChannel>;
  /** Stages blob `hex` on the node before an `installApp {blob}` forward. */
  ensureBlob(hex: string): Promise<EnsureBlobOutcome>;
}

export interface RelaySessionOptions {
  client: CloseableChannel;
  nodes: readonly SessionNode[];
  /** Injectable so units can pin the loss-log ordering; `[relay]`-voiced by default. */
  logError?: (message: string) => void;
}

// ── Frame shapes (structural — a router judges shape, never meaning) ───────

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

interface RequestFrame extends Record<string, unknown> {
  id: string;
  method: string;
  params?: unknown;
}

interface ResponseFrame extends Record<string, unknown> {
  id: string;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

function asRequest(msg: Record<string, unknown>): RequestFrame | undefined {
  return typeof msg.id === 'string' && typeof msg.method === 'string'
    ? (msg as RequestFrame)
    : undefined;
}

function asResponse(msg: Record<string, unknown>): ResponseFrame | undefined {
  return typeof msg.id === 'string' && !('method' in msg) ? (msg as ResponseFrame) : undefined;
}

function isNotification(msg: Record<string, unknown>): boolean {
  return !('id' in msg) && typeof msg.method === 'string';
}

/** The JSON-RPC `error` field of a response, as far as a router reads it. */
interface WireErrorShape {
  code: number;
  message: string;
  data?: unknown;
}

function wireErrorOf(msg: ResponseFrame): WireErrorShape | undefined {
  const error = msg.error;
  return isRecord(error) && typeof error.code === 'number' ? error : undefined;
}

// ── Fan-out bookkeeping ────────────────────────────────────────────────────

/** One node's outcome inside the aggregate — `details.nodes[]`, config order. */
interface NodeOutcome {
  node: string;
  code: number;
  message: string;
  /** @issue DTX-7002: the node's own exhaustion payload is carried through opaque, never rewritten into relay ids. */
  holders?: unknown;
}

interface FanOut {
  readonly id: string;
  readonly frame: RequestFrame;
  /** Set when the client's `$/cancelRequest` arrived between attempts. */
  cancelRequested: boolean;
  /** The attempt in flight, if any — cancel frames route here. */
  current?: UpstreamState;
}

type AttemptResult =
  | { kind: 'answered' } // a response was forwarded to the client — done
  | { kind: 'advance'; outcome: NodeOutcome };

interface UpstreamState {
  readonly node: SessionNode;
  channel?: CloseableChannel;
  connecting?: Promise<CloseableChannel>;
  alive: boolean;
  /** @issue DTX-7003: client→node forwarding is FIFO per node — nothing queued behind the async blob bridge may overtake it. */
  sendQueue: Promise<void>;
  /** Fan-out interceptors: response ids this session is waiting on here. */
  readonly intercepts: Map<string, (msg: ResponseFrame) => void>;
  /** node-side allocationId → relay-minted opaque id. */
  readonly allocToRelay: Map<string, string>;
  /** Latest un-adopted `deviceStateChanged` per node allocation (the gap). */
  readonly earlyPushes: Map<string, Record<string, unknown>>;
}

export class RelaySession {
  readonly #client: CloseableChannel;
  readonly #upstreams: UpstreamState[];
  readonly #logError: (message: string) => void;

  /** relay-minted opaque id → owner. Grows per allocation; never leaks a node name. */
  readonly #allocations = new Map<string, { up: UpstreamState; nodeAllocId: string }>();
  /** In-flight (unanswered) request ids → the node they were forwarded to. */
  readonly #routes = new Map<string, UpstreamState>();
  /** Recently answered ids, for late-cancel pairing (insertion-ordered cap). */
  readonly #answered = new Map<string, UpstreamState>();
  /** Ids whose frame is queued but not yet dispatched — a cancel in that
   *  window is answered by the relay itself (nothing exists node-side). */
  readonly #unsentTasks = new Map<string, UpstreamState>();
  /** In-flight `releaseDevice` ids → the relay allocation to prune on success. */
  readonly #releaseIntents = new Map<string, string>();
  /** Active allocateDevice fan-outs by request id. */
  readonly #fanouts = new Map<string, FanOut>();
  #closed = false;

  constructor({ client, nodes, logError = relayError }: RelaySessionOptions) {
    this.#client = client;
    this.#logError = logError;
    this.#upstreams = nodes.map((node) => ({
      node,
      alive: true,
      sendQueue: Promise.resolve(),
      intercepts: new Map(),
      allocToRelay: new Map(),
      earlyPushes: new Map(),
    }));

    client.onMessage((msg) => {
      this.#onClientMessage(msg);
    });
    client.onClose(() => {
      this.#onClientClose();
    });
    client.onError((err) => {
      this.#logError(`client channel error: ${err.message}`);
    });
  }

  /** Ends the session as the relay's own teardown would — closes every hop. */
  close(): void {
    this.#client.close();
    // The client channel's close handler runs synchronously and closes the
    // upstreams; this is only the belt for a client that was already gone.
    this.#onClientClose();
  }

  // ── Client → relay ───────────────────────────────────────────────────────

  #onClientMessage(msg: unknown): void {
    if (this.#closed || !isRecord(msg)) return;

    // @issue DTX-7004: a numeric id (this dialect mints strings) is answered -32600, not silently dropped.
    if (typeof msg.id === 'number' && typeof msg.method === 'string') {
      this.#client.send({
        jsonrpc: '2.0',
        id: msg.id,
        error: { code: JSONRPC_INVALID_REQUEST, message: 'this dialect uses string request ids' },
      });
      return;
    }

    const request = asRequest(msg);
    if (request) {
      // @issue DTX-7004: a reused id while its first life is still in flight is refused, not left to hang.
      if (
        this.#fanouts.has(request.id) ||
        this.#routes.has(request.id) ||
        this.#unsentTasks.has(request.id)
      ) {
        this.#respondError(request.id, {
          code: JSONRPC_INVALID_REQUEST,
          message: `request id "${request.id}" is already in flight on this session`,
        });
        return;
      }
      if (request.method === 'allocateDevice') {
        void this.#runFanOut(request);
        return;
      }
      this.#routeAddressedRequest(request);
      return;
    }

    if (isNotification(msg)) {
      if (msg.method === '$/cancelRequest') {
        this.#routeCancelRequest(msg);
        return;
      }
      // @issue DTX-7005: an unknown client notification (no id) is unroutable and dropped.
      return;
    }
    // @issue DTX-7005: a response from the client (the relay originates none) is malformed traffic, dropped.
  }

  #routeAddressedRequest(request: RequestFrame): void {
    const params = isRecord(request.params) ? request.params : undefined;
    const relayAllocId = typeof params?.allocationId === 'string' ? params.allocationId : undefined;

    if (params === undefined || relayAllocId === undefined) {
      // @issue DTX-7006: no allocationId and not allocateDevice — the one routing rule cannot place it; answers 2010.
      this.#respondError(request.id, {
        code: DetoxErrorCode.DETOX_NOT_IMPLEMENTED,
        message:
          `the relay cannot route "${request.method}": it names no allocationId ` +
          'and is not allocateDevice (spec 008 routing rule)',
        data: { method: request.method },
      });
      return;
    }

    const allocation = this.#allocations.get(relayAllocId);
    if (!allocation || !allocation.up.alive) {
      // One answer for every reason a handle can die — stale, foreign, and dead-node are indistinguishable.
      this.#respondError(request.id, {
        code: DetoxErrorCode.DETOX_STALE_HANDLE,
        message:
          'unknown allocation — already released, reclaimed by the server, or never issued ' +
          'to this session',
        data: { method: request.method },
      });
      return;
    }

    const up = allocation.up;
    const rewritten: RequestFrame = {
      ...request,
      params: { ...params, allocationId: allocation.nodeAllocId },
    };
    this.#routes.set(request.id, up);
    // @issue DTX-7007: until the frame physically leaves for the node, a cancel in that window is answered locally.
    this.#unsentTasks.set(request.id, up);
    // @issue DTX-7008: pruning a released allocation's mapping keeps it bounded; a later verb on it answers 2008 locally.
    if (request.method === 'releaseDevice') this.#releaseIntents.set(request.id, relayAllocId);

    const blob = isRecord(params.blob) ? params.blob : undefined;
    const hex = typeof blob?.hex === 'string' ? blob.hex : undefined;
    if (
      request.method === 'installApp' &&
      blob?.algo === 'sha256' &&
      hex !== undefined &&
      SHA256_HEX_RE.test(hex)
    ) {
      // @issue DTX-7009: the blob lane crosses hop-by-hop — stage the bytes on the node, then forward the verb unchanged.
      this.#enqueue(up, async () => {
        // A node death (or teardown) that raced the queue already answered
        // this id with 2006 — the bridge must neither run nor double-answer.
        if (this.#routes.get(request.id) !== up) return;
        const outcome = await up.node.ensureBlob(hex);
        // The route can also vanish during the push: a cancel answered
        // locally, or an upstream death — either way this id is settled.
        if (this.#closed || this.#routes.get(request.id) !== up) return;
        if (this.#unsentTasks.get(request.id) !== up) return;
        this.#unsentTasks.delete(request.id);
        if (!outcome.ok) {
          this.#routes.delete(request.id);
          this.#respondError(request.id, {
            code: DetoxErrorCode.DETOX_APP_TRANSFER_FAILED,
            message: `installApp could not stage the build on the node — ${outcome.reason ?? 'unknown reason'}`,
            data: { method: 'installApp', blob: `sha256/${hex}` },
          });
          return;
        }
        up.channel?.send(rewritten);
      });
      return;
    }

    // @issue DTX-7010: a malformed blob skips the bridge and forwards as-is; judging arguments is the node's job.
    this.#enqueue(up, () => {
      if (this.#routes.get(request.id) !== up) return;
      if (this.#unsentTasks.get(request.id) !== up) return;
      this.#unsentTasks.delete(request.id);
      up.channel?.send(rewritten);
    });
  }

  #routeCancelRequest(msg: Record<string, unknown>): void {
    const params = isRecord(msg.params) ? msg.params : undefined;
    const targetId = typeof params?.id === 'string' ? params.id : undefined;
    if (targetId === undefined) return;

    // @issue DTX-7007: a call still queued (frame not yet dispatched) is answered locally on cancel — the client keeps no clock of its own.
    const unsent = this.#unsentTasks.get(targetId);
    if (unsent) {
      this.#unsentTasks.delete(targetId);
      this.#routes.delete(targetId);
      this.#releaseIntents.delete(targetId);
      this.#client.send({
        jsonrpc: '2.0',
        id: targetId,
        error: {
          code: JSONRPC_CANCELLED,
          message: 'cancelled before the verb reached its node',
          data: { outcome: 'nothing-to-undo' },
        },
      });
      return;
    }

    const fan = this.#fanouts.get(targetId);
    if (fan) {
      fan.cancelRequested = true;
      // Mid-attempt, a cancel forwards to the node running it — its
      // compensation settles naturally.
      // Between attempts, the flag alone settles it at the next boundary. The
      // answered-map fallback covers the sliver where the attempt just
      // answered but the fan-out has not unwound yet: the cancel must still
      // reach the node whose retention window runs the undo for an
      // already-answered id.
      const target = fan.current ?? this.#answered.get(targetId);
      target?.channel?.send(msg);
      return;
    }

    const target = this.#routes.get(targetId) ?? this.#answered.get(targetId);
    if (target) {
      // Sent directly, not through the per-node FIFO — the request is
      // already on the node, so overtaking here is safe, and parking a
      // cancel behind a build push would defeat it.
      target.channel?.send(msg);
      return;
    }
    // A cancel target nobody remembers gets a synthesized $/cancelAck with
    // outcome "unknown".
    this.#client.send({
      jsonrpc: '2.0',
      method: '$/cancelAck',
      params: { id: targetId, outcome: 'unknown' },
    });
  }

  #onClientClose(): void {
    if (this.#closed) return;
    this.#closed = true;
    // @issue DTX-7013: client close is immediate and unconditional — no grace window; it frees the farm.
    for (const up of this.#upstreams) {
      up.alive = false;
      up.channel?.close();
      up.channel = undefined;
      // @issue DTX-7014: a dial still in flight needs no handling — #ensureConnected sees #closed and closes it late.
      // Settle any fan-out attempt parked on this node so its stall timer
      // dies with the session, not lingering for a full stall window after
      // the client is gone.
      const intercepts = [...up.intercepts.values()];
      up.intercepts.clear();
      for (const intercept of intercepts) {
        intercept({
          id: '',
          error: { code: DetoxErrorCode.DETOX_CONNECTION_LOST, message: 'session closed' },
        });
      }
    }
    for (const timer of this.#attemptTimers.values()) clearTimeout(timer);
    this.#attemptTimers.clear();
    this.#attemptResets.clear();
    this.#fanouts.clear();
    this.#routes.clear();
    this.#answered.clear();
    this.#allocations.clear();
    this.#unsentTasks.clear();
    this.#releaseIntents.clear();
  }

  // ── Node → relay ─────────────────────────────────────────────────────────

  #onUpstreamMessage(up: UpstreamState, msg: unknown): void {
    if (this.#closed || !up.alive || !isRecord(msg)) return;

    const response = asResponse(msg);
    if (response) {
      const intercept = up.intercepts.get(response.id);
      if (intercept) {
        up.intercepts.delete(response.id);
        intercept(response);
        return;
      }
      if (this.#routes.get(response.id) === up) {
        this.#routes.delete(response.id);
        this.#rememberAnswered(response.id, up);
        // A successful release retires its mapping — see #routeAddressedRequest.
        const releasedAlloc = this.#releaseIntents.get(response.id);
        if (releasedAlloc !== undefined) {
          this.#releaseIntents.delete(response.id);
          if (response.error === undefined) {
            const allocation = this.#allocations.get(releasedAlloc);
            if (allocation) {
              this.#allocations.delete(releasedAlloc);
              allocation.up.allocToRelay.delete(allocation.nodeAllocId);
            }
          }
        }
        this.#client.send(msg); // verbatim — the relay never reclassifies an error
        return;
      }
      return; // a late answer from an abandoned attempt, or noise — dropped
    }

    if (isNotification(msg)) {
      const params = isRecord(msg.params) ? msg.params : undefined;

      if (msg.method === 'deviceStateChanged') {
        const nodeAllocId = typeof params?.allocationId === 'string' ? params.allocationId : undefined;
        if (nodeAllocId === undefined) return;
        const relayId = up.allocToRelay.get(nodeAllocId);
        if (relayId !== undefined) {
          // @issue DTX-7015: the deviceStateChanged rewrite is synchronous — the push must stay ahead of the following answer.
          this.#client.send({ ...msg, params: { ...params, allocationId: relayId } });
          return;
        }
        // @issue DTX-7016: a push in the allocation gap is buffered; adoption flushes it just before the allocateDevice answer.
        if (up.earlyPushes.size >= EARLY_PUSH_MAX && !up.earlyPushes.has(nodeAllocId)) {
          const oldest = up.earlyPushes.keys().next().value;
          if (oldest !== undefined) up.earlyPushes.delete(oldest);
        }
        up.earlyPushes.set(nodeAllocId, msg);
        return;
      }

      if (msg.method === '$/progress') {
        const token = typeof params?.token === 'string' ? params.token : undefined;
        if (token === undefined) return;
        const fan = this.#fanouts.get(token);
        if (fan?.current === up) {
          this.#noteAttemptFrame(up, token);
          this.#client.send(msg);
          return;
        }
        if (this.#routes.get(token) === up) {
          this.#client.send(msg);
        }
        return; // narration from an abandoned attempt — its operation is over
      }

      if (msg.method === '$/cancelAck') {
        // @issue DTX-7017: only the node that owns an id may deliver its $/cancelAck — a forged ack could settle it with a lie.
        const ackId = typeof params?.id === 'string' ? params.id : undefined;
        if (
          ackId !== undefined &&
          (this.#routes.get(ackId) === up || this.#answered.get(ackId) === up)
        ) {
          this.#client.send(msg);
        }
        return;
      }

      if (msg.method === '$/serverInfo') {
        // @issue DTX-7018: $/serverInfo from a node is consumed, not forwarded — version identity is hop-pairwise.
        return;
      }

      // @issue DTX-7018: any other node notification forwards verbatim — unknown methods are LSP-ignorable client-side.
      this.#client.send(msg);
      return;
    }

    const request = asRequest(msg);
    if (request) {
      // No node sends requests today: refused -32601 at the node itself, no client is bothered guessing one.
      this.#logError(`node "${up.node.name}" sent an unexpected request "${request.method}" — refused`);
      up.channel?.send({
        jsonrpc: '2.0',
        id: request.id,
        error: { code: JSONRPC_METHOD_NOT_FOUND, message: 'the relay accepts no requests from nodes' },
      });
    }
  }

  #onUpstreamClose(up: UpstreamState): void {
    if (!up.alive) return;
    up.alive = false;
    up.channel = undefined;
    if (this.#closed) return; // our own teardown — nothing to settle, nobody to tell

    // @issue DTX-7020: routing state is cleared before the loss is logged — a verb on this node answers 2008 at log time.
    const stranded = [...this.#routes].filter(([, owner]) => owner === up).map(([id]) => id);
    for (const id of stranded) {
      this.#routes.delete(id);
      this.#unsentTasks.delete(id);
      this.#releaseIntents.delete(id);
    }
    for (const relayId of up.allocToRelay.values()) this.#allocations.delete(relayId);
    up.allocToRelay.clear();
    up.earlyPushes.clear();
    for (const [id] of [...this.#answered].filter(([, owner]) => owner === up)) {
      this.#answered.delete(id);
    }
    const intercepts = [...up.intercepts.values()];
    up.intercepts.clear();

    // The log line, after the flip, naming the node.
    this.#logError(
      `lost connection to node "${up.node.name}" — its in-flight calls answer 2006, ` +
        'its allocations are stale from here on',
    );

    // @issue DTX-7021: upstream death settles every stranded call with 2006 (including one awaiting its $/cancelAck), never naming the node.
    for (const id of stranded) {
      this.#respondError(id, {
        code: DetoxErrorCode.DETOX_CONNECTION_LOST,
        message: 'the connection to the node running this call was lost mid-call',
      });
    }
    // A fan-out attempt on the dying node advances — its interceptor sees
    // the death as a synthesized 2006.
    for (const intercept of intercepts) {
      intercept({
        id: '',
        error: {
          code: DetoxErrorCode.DETOX_CONNECTION_LOST,
          message: `connection to node "${up.node.name}" was lost mid-attempt`,
        },
      });
    }
  }

  // ── Allocation fan-out (sequential, one pass, no waiting machinery) ──

  async #runFanOut(request: RequestFrame): Promise<void> {
    const fan: FanOut = { id: request.id, frame: request, cancelRequested: false };
    this.#fanouts.set(request.id, fan);
    const outcomes: NodeOutcome[] = [];
    try {
      for (const up of this.#upstreams) {
        if (this.#closed) return;
        if (fan.cancelRequested) {
          this.#respondCancelledByRelay(fan);
          return;
        }
        const result = await this.#attemptOn(up, fan);
        if (this.#closed) return;
        if (result.kind === 'answered') return;
        outcomes.push(result.outcome);
      }
      if (fan.cancelRequested) {
        this.#respondCancelledByRelay(fan);
        return;
      }
      this.#respondAggregate(fan, outcomes);
    } finally {
      this.#fanouts.delete(request.id);
      this.#attemptResets.delete(request.id);
    }
  }

  #attemptOn(up: UpstreamState, fan: FanOut): Promise<AttemptResult> {
    const { id } = fan;
    const nodeName = up.node.name;

    // @issue DTX-7023: the stall clock covers the whole attempt including the dial — a SYN blackhole wedges like a wedged process.
    // The dial below is a floating task feeding `settle`, never an inline
    // await: awaiting it would put this function's return after the very
    // wedge the clock exists to abandon.
    let settle!: (result: AttemptResult) => void;
    const settled = new Promise<AttemptResult>((resolve) => {
      let done = false;
      settle = (result) => {
        if (done) return;
        done = true;
        clearTimeout(this.#attemptTimers.get(id));
        this.#attemptTimers.delete(id);
        up.intercepts.delete(id);
        if (fan.current === up) fan.current = undefined;
        resolve(result);
      };
    });
    const armStall = (): void => {
      clearTimeout(this.#attemptTimers.get(id));
      const timer = setTimeout(() => {
        // @issue DTX-7024: a still-pending dial is forgotten on abandon so the next attempt re-dials fresh, never inheriting the corpse.
        if (!up.channel) up.connecting = undefined;
        // @issue DTX-7025: abandoning is not cancelling — a best-effort $/cancelRequest still goes out so a merely-slow node rolls back.
        // Sent directly, not through the per-node FIFO — the queue may be
        // blocked by the very wedge being abandoned.
        up.channel?.send({ jsonrpc: '2.0', method: '$/cancelRequest', params: { id } });
        settle({
          kind: 'advance',
          outcome: {
            node: nodeName,
            code: DetoxErrorCode.DETOX_SERVER_UNREACHABLE,
            message:
              `no frame from node "${nodeName}" for ${String(ALLOCATION_STALL_MS / 1000)} s — ` +
              'attempt abandoned (stall detector)',
          },
        });
      }, ALLOCATION_STALL_MS);
      this.#attemptTimers.set(id, timer);
    };
    armStall();
    this.#attemptResets.set(id, armStall);

    fan.current = up;
    up.intercepts.set(id, (response) => {
      const error = wireErrorOf(response);
      if (!error) {
        settle({ kind: 'answered' });
        this.#adoptAndForward(up, fan.frame.id, response);
        return;
      }
      // @issue DTX-7026: only 2011 and caller-left (2003/-32800) short-circuit the pass; everything else, including future codes, advances.
      if (
        error.code === DetoxErrorCode.DETOX_INVALID_ARGUMENT ||
        error.code === DetoxErrorCode.DETOX_ABORTED ||
        error.code === JSONRPC_CANCELLED
      ) {
        settle({ kind: 'answered' });
        // Remembered like any answered id, so a late $/cancelRequest still
        // pairs with the node that actually answered.
        this.#rememberAnswered(fan.frame.id, up);
        this.#client.send({ ...response, id: fan.frame.id });
        return;
      }
      if (error.code === DetoxErrorCode.DETOX_UNAUTHORIZED) {
        // @issue DTX-7027: a 2005 (bad node token) must not down the fleet and must not hide — logged loudly, named in the aggregate.
        this.#logError(
          `node "${nodeName}" rejected the RELAY's credentials (2005) — check its token in --nodes`,
        );
      }
      const holders = isRecord(error.data) ? error.data.holders : undefined;
      settle({
        kind: 'advance',
        outcome: {
          node: nodeName,
          code: error.code,
          // A hostile node could put a non-string here; the aggregate's
          // shape promises prose.
          message: typeof error.message === 'string' ? error.message : String(error.message),
          ...(holders !== undefined ? { holders } : {}),
        },
      });
    });

    void this.#ensureConnected(up).then(
      (channel) => {
        if (this.#closed) {
          settle({ kind: 'answered' }); // nobody left to answer — just stop
          return;
        }
        // @issue DTX-7024: the stall clock may have abandoned this attempt mid-dial — no intercept means nobody is watching.
        if (!up.intercepts.has(id)) return;
        if (fan.cancelRequested) {
          // @issue DTX-7028: cancelled during dial — nothing was sent, so there's nothing to compensate; the loop's boundary check answers the client.
          settle({
            kind: 'advance',
            outcome: { node: nodeName, code: DetoxErrorCode.DETOX_ABORTED, message: 'cancelled before dispatch' },
          });
          return;
        }
        armStall();
        // Forwards the client's frame verbatim — same id and params, exactly
        // what a direct client would send. Sent directly, not through the
        // per-node FIFO: an attempt is always this id's first frame toward
        // the node, so nothing to overtake.
        channel.send(fan.frame);
      },
      (err: unknown) => {
        if (!up.intercepts.has(id)) return; // already abandoned — outcome recorded
        const unauthorized =
          err instanceof DetoxConnectionError && err.code === DetoxErrorCode.DETOX_UNAUTHORIZED;
        if (unauthorized) {
          this.#logError(
            `node "${nodeName}" rejected the RELAY's credentials (2005) — check its token in --nodes`,
          );
        }
        // @issue DTX-7029: the outcome message is built from the configured name and code alone, never the dial error's text (it names the node's URL).
        settle({
          kind: 'advance',
          outcome: unauthorized
            ? {
                node: nodeName,
                code: DetoxErrorCode.DETOX_UNAUTHORIZED,
                message: `node "${nodeName}" rejected the relay's node credentials (401)`,
              }
            : {
                node: nodeName,
                code: DetoxErrorCode.DETOX_SERVER_UNREACHABLE,
                message: `node "${nodeName}" could not be reached`,
              },
        });
      },
    );
    return settled;
  }

  /** Per-attempt stall timers and their re-arm hooks, keyed by request id. */
  readonly #attemptTimers = new Map<string, NodeJS.Timeout>();
  readonly #attemptResets = new Map<string, () => void>();

  #noteAttemptFrame(up: UpstreamState, id: string): void {
    // A frame from the node is liveness — the wedge detector re-arms.
    if (this.#fanouts.get(id)?.current === up) this.#attemptResets.get(id)?.();
  }

  #adoptAndForward(up: UpstreamState, clientId: string, response: ResponseFrame): void {
    const result = isRecord(response.result) ? response.result : undefined;
    const nodeAllocId = typeof result?.allocationId === 'string' ? result.allocationId : undefined;
    if (result === undefined || nodeAllocId === undefined) {
      // A success with no allocationId is a node protocol break; forwarding
      // it unrewritten would hand the client an unroutable handle. The
      // node's name stays in the log only, never in the wire payload.
      this.#logError(`node "${up.node.name}" answered allocateDevice without an allocationId`);
      this.#respondError(clientId, {
        code: DetoxErrorCode.DETOX_INTERNAL,
        message: 'the node answered allocateDevice without an allocationId',
      });
      return;
    }
    // @issue DTX-7030: relayId is minted opaque here — no node name or node-side id substring a client could parse.
    const relayId = randomUUID();
    up.allocToRelay.set(nodeAllocId, relayId);
    this.#allocations.set(relayId, { up, nodeAllocId });
    this.#rememberAnswered(clientId, up);

    // @issue DTX-7016: the gap's buffered push flushes first, rewritten, before the allocateDevice answer.
    const early = up.earlyPushes.get(nodeAllocId);
    if (early !== undefined) {
      up.earlyPushes.delete(nodeAllocId);
      const params = isRecord(early.params) ? early.params : {};
      this.#client.send({ ...early, params: { ...params, allocationId: relayId } });
    }
    this.#client.send({ ...response, id: clientId, result: { ...result, allocationId: relayId } });
  }

  #respondCancelledByRelay(fan: FanOut): void {
    // @issue DTX-7028: a cancel that lands with no node holding the call answers -32800/nothing-to-undo locally.
    this.#client.send({
      jsonrpc: '2.0',
      id: fan.id,
      error: {
        code: JSONRPC_CANCELLED,
        message: 'cancelled before any node held the call',
        data: { outcome: 'nothing-to-undo' },
      },
    });
  }

  #respondAggregate(fan: FanOut, outcomes: NodeOutcome[]): void {
    const nodes = outcomes.map((outcome) => ({ ...outcome }));
    const allAre = (code: number): boolean =>
      outcomes.length > 0 && outcomes.every((outcome) => outcome.code === code);

    let error;
    if (allAre(DetoxErrorCode.DETOX_NO_MATCHING_DEVICE)) {
      error = new NoMatchingDeviceError(
        `no node in this fleet can ever satisfy the query (${String(outcomes.length)} tried)`,
        { details: { nodes } },
      );
    } else if (allAre(DetoxErrorCode.DETOX_UNAUTHORIZED)) {
      // @issue DTX-7031: all-2005 is the one non-2002 exception — terminal for the caller, actionable for the operator; inverts the per-host "terminal beats transient" ranking.
      error = new DetoxConnectionError(
        'every node rejected the RELAY\'s node credentials — the tokens in the relay\'s ' +
          '--nodes config are wrong (your own token was accepted, or you would not have ' +
          'gotten this far)',
        { code: DetoxErrorCode.DETOX_UNAUTHORIZED, details: { nodes } },
      );
    } else {
      error = new DevicePoolExhaustedError(
        `no node in this fleet could allocate right now (${String(outcomes.length)} tried)`,
        { details: { nodes } },
      );
    }
    this.#client.send({ jsonrpc: '2.0', id: fan.id, error: toWireError(error) });
  }

  // ── Plumbing ─────────────────────────────────────────────────────────────

  #ensureConnected(up: UpstreamState): Promise<CloseableChannel> {
    if (up.channel && up.alive) return Promise.resolve(up.channel);
    if (!up.connecting) {
      // @issue DTX-7024: generation-aware — a stall-abandoned dial's late-completing socket is closed, never adopted.
      const dial: Promise<CloseableChannel> = up.node.connect().then(
        (channel) => {
          if (this.#closed || up.connecting !== dial) {
            channel.close();
            throw new DetoxConnectionError('the dial was abandoned before it completed', {
              code: DetoxErrorCode.DETOX_CONNECTION_LOST,
            });
          }
          up.connecting = undefined;
          up.channel = channel;
          up.alive = true;
          channel.onMessage((msg) => {
            this.#onUpstreamMessage(up, msg);
          });
          channel.onClose(() => {
            this.#onUpstreamClose(up);
          });
          channel.onError((err) => {
            this.#logError(`channel error toward node "${up.node.name}": ${err.message}`);
          });
          return channel;
        },
        (err: unknown) => {
          if (up.connecting === dial) up.connecting = undefined;
          throw err;
        },
      );
      up.connecting = dial;
    }
    return up.connecting;
  }

  /** FIFO per node — see `UpstreamState.sendQueue`. */
  #enqueue(up: UpstreamState, task: () => void | Promise<void>): void {
    up.sendQueue = up.sendQueue
      .then(() => (this.#closed || !up.alive ? undefined : task()))
      .catch((err: unknown) => {
        this.#logError(
          `forwarding toward node "${up.node.name}" failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      });
  }

  #rememberAnswered(id: string, up: UpstreamState): void {
    this.#answered.set(id, up);
    if (this.#answered.size > ANSWERED_RETENTION_MAX) {
      const oldest = this.#answered.keys().next().value;
      if (oldest !== undefined) this.#answered.delete(oldest);
    }
  }

  #respondError(id: string, error: WireErrorShape): void {
    this.#client.send({ jsonrpc: '2.0', id, error });
  }
}
