/**
 * RelaySession units (spec 008) — the frame router, the fan-out
 * classification table, id opacity, order preservation, and the half-dead
 * matrix, all over in-memory channel pairs: no sockets, no simulators.
 * These are the spec's integration-gated wire contracts at unit speed; the
 * real-socket halves live in relay.test.ts / upstream.test.ts.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';

import { memoryChannel, type MemoryChannel } from '@detox-remote/core';

import { RelaySession, ALLOCATION_STALL_MS, type SessionNode } from '../session';
import type { EnsureBlobOutcome } from '../blob-bridge';

const HEX = 'a'.repeat(64);

// ── Fakes ──────────────────────────────────────────────────────────────────

interface Frame extends Record<string, unknown> {
  id?: string;
  method?: string;
  params?: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: { code: number; message: string; data?: unknown };
}

interface FakeNodeOptions {
  /** Reject every dial with this error instead of connecting. */
  dialError?: Error;
  /** Never resolve the dial (a SYN blackhole) unless released manually. */
  hangDial?: boolean;
  /** Auto-responder run for every frame the node receives. */
  onFrame?: (frame: Frame, api: FakeNodeApi) => void;
  ensureBlob?: (hex: string) => Promise<EnsureBlobOutcome>;
}

/** A device query as these tests spell it. */
interface DeviceQuery {
  id?: string;
}

/** `$/cancelRequest` params, as far as a fake node reads them. */
interface CancelParams {
  id: string;
}

/** One `details.nodes[]` entry of the aggregate. */
interface NodeEntry {
  node: string;
  code: number;
}

interface AggregateData {
  nodes: NodeEntry[];
}

interface OpaqueNodesData {
  nodes: Record<string, unknown>[];
}

interface ErrableChannel {
  channel: MemoryChannel;
  fireError: (err: Error) => void;
}

/** A channel wrapper whose error handlers a test can fire on demand. */
function errableChannel(inner: MemoryChannel): ErrableChannel {
  const errorHandlers: ((err: Error) => void)[] = [];
  return {
    channel: {
      send: (msg) => inner.send(msg),
      onMessage: (handler) => inner.onMessage(handler),
      onClose: (handler) => inner.onClose(handler),
      onError: (handler) => {
        errorHandlers.push(handler);
      },
      close: () => inner.close(),
    },
    fireError: (err) => {
      for (const handler of errorHandlers) handler(err);
    },
  };
}

interface FakeNodeApi {
  /** node → relay */
  send(frame: unknown): void;
  refuse(id: string, code: number, data?: unknown): void;
  succeed(id: string, nodeAllocId: string, udid?: string): void;
}

interface FakeNode {
  node: SessionNode;
  api: FakeNodeApi;
  frames: Frame[];
  connects: number;
  connected: boolean;
  nodeSideClosed: boolean;
  ensureBlobCalls: string[];
  releaseDial(): void;
  /** The node process dies: its side of the channel closes. */
  die(): void;
}

function fakeNode(name: string, options: FakeNodeOptions = {}): FakeNode {
  const frames: Frame[] = [];
  const ensureBlobCalls: string[] = [];
  let nodeSide: MemoryChannel | undefined;
  let releaseDial: () => void = () => undefined;

  const api: FakeNodeApi = {
    send: (frame) => nodeSide?.send(frame),
    refuse: (id, code, data) =>
      nodeSide?.send({
        jsonrpc: '2.0',
        id,
        error: { code, message: `refused by ${name}`, ...(data !== undefined ? { data } : {}) },
      }),
    succeed: (id, nodeAllocId, udid = 'udid-1') =>
      nodeSide?.send({
        jsonrpc: '2.0',
        id,
        result: {
          allocationId: nodeAllocId,
          device: { udid },
          name: 'iPhone 17',
          os: 'iOS 26.5',
          state: 'booted',
        },
      }),
  };

  const self: FakeNode = {
    api,
    frames,
    connects: 0,
    connected: false,
    nodeSideClosed: false,
    ensureBlobCalls,
    releaseDial: () => {
      releaseDial();
    },
    die: () => nodeSide?.close(),
    node: {
      name,
      connect: () => {
        self.connects += 1;
        if (options.dialError) return Promise.reject(options.dialError);
        const connectNow = (): MemoryChannel => {
          const [relayEnd, nodeEnd] = memoryChannel();
          nodeSide = nodeEnd;
          self.connected = true;
          nodeEnd.onMessage((msg) => {
            frames.push(msg as Frame);
            options.onFrame?.(msg as Frame, api);
          });
          nodeEnd.onClose(() => {
            self.nodeSideClosed = true;
          });
          return relayEnd;
        };
        if (options.hangDial) {
          return new Promise<MemoryChannel>((resolve) => {
            releaseDial = () => resolve(connectNow());
          });
        }
        return Promise.resolve(connectNow());
      },
      ensureBlob: (hex) => {
        ensureBlobCalls.push(hex);
        return options.ensureBlob ? options.ensureBlob(hex) : Promise.resolve({ ok: true });
      },
    },
  };
  return self;
}

interface Harness {
  session: RelaySession;
  client: MemoryChannel;
  received: Frame[];
  logs: string[];
  closeClient(): void;
}

function harness(nodes: FakeNode[], logError?: (message: string) => void): Harness {
  const [relayEnd, clientEnd] = memoryChannel();
  const received: Frame[] = [];
  const logs: string[] = [];
  clientEnd.onMessage((msg) => received.push(msg as Frame));
  const session = new RelaySession({
    client: relayEnd,
    nodes: nodes.map((n) => n.node),
    logError:
      logError ??
      ((message) => {
        logs.push(message);
      }),
  });
  return { session, client: clientEnd, received, logs, closeClient: () => clientEnd.close() };
}

const allocFrame = (id: string): Frame => ({
  jsonrpc: '2.0',
  id,
  method: 'allocateDevice',
  params: { type: 'ios.simulator', device: { id: 'SOME-UDID' } },
});

// Macrotask turns, not bare microtasks: a two-node fan-out crosses more
// promise hops than a fixed microtask count can cover deterministically.
const flush = async (): Promise<void> => {
  for (let i = 0; i < 4; i += 1) await new Promise((resolve) => setTimeout(resolve, 0));
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

afterEach(() => {
  vi.useRealTimers();
});

// ── Routing ────────────────────────────────────────────────────────────────

describe('routing', () => {
  it('answers 2008 for a verb naming an allocation the relay never issued', async () => {
    const h = harness([fakeNode('mac-a')]);
    h.client.send({ jsonrpc: '2.0', id: '1', method: 'bootDevice', params: { allocationId: 'nope' } });
    await flush();
    expect(h.received).toHaveLength(1);
    expect(h.received[0].error?.code).toBe(2008);
  });

  /**
   * @issue DTX-7006
   * A request with no `allocationId` that isn't `allocateDevice` doesn't fit
   * the relay's one routing rule, so it can't be placed on
   * any node. The relay answers 2010 itself.
   */
  it('answers 2010 for a request the routing rule cannot place (no allocationId, not allocateDevice)', async () => {
    const h = harness([fakeNode('mac-a')]);
    h.client.send({ jsonrpc: '2.0', id: '1', method: 'someFutureVerb', params: {} });
    await flush();
    expect(h.received[0].error?.code).toBe(2010);
    expect(h.received[0].error?.message).toContain('someFutureVerb');
  });

  /**
   * @issue DTX-7018
   * Version identity is hop-pairwise: the relay already
   * announced its own versions on the client's connect, and forwarding a
   * node's own `$/serverInfo` would show the client a version it isn't
   * actually talking to. Any other node notification forwards verbatim —
   * unknown methods are LSP-ignorable client-side.
   */
  it("consumes a node's $/serverInfo instead of forwarding it — version identity is hop-pairwise", async () => {
    const a = fakeNode('mac-a', {
      onFrame: (f, api) => {
        if (f.method === 'allocateDevice') api.succeed(f.id ?? '', 'alloc-1');
      },
    });
    const h = harness([a]);
    h.client.send(allocFrame('1'));
    await flush();
    const before = h.received.length;
    a.api.send({ jsonrpc: '2.0', method: '$/serverInfo', params: { protocol: 99, server: 'node-x' } });
    a.api.send({ jsonrpc: '2.0', method: '$/futureThing', params: {} });
    await flush();
    const after = h.received.slice(before);
    expect(after).toHaveLength(1);
    expect(after[0].method).toBe('$/futureThing');
  });

  /**
   * @issue DTX-7005
   * A response from the client (the relay originates no requests of its own)
   * and an unknown client notification with no id are both unroutable — the
   * relay drops them rather than crashing or guessing a home for them.
   */
  it('drops malformed client traffic without crashing (responses, junk, unknown notifications)', async () => {
    const h = harness([fakeNode('mac-a')]);
    h.client.send('not even an object');
    h.client.send({ jsonrpc: '2.0', id: '9', result: {} }); // a response from a client
    h.client.send({ jsonrpc: '2.0', method: '$/mystery', params: {} });
    h.client.send({ jsonrpc: '2.0', method: '$/cancelRequest', params: { id: 42 } }); // non-string id
    await flush();
    expect(h.received).toHaveLength(0);
  });

  /**
   * @issue DTX-7004
   * This dialect mints string request ids; a numeric id is a dialect
   * mismatch and is answered -32600, not silently dropped (nothing below the
   * relay times out a dropped id). An id reused while its first life is
   * still in flight would cross the routing wires (the stall timer and
   * interceptor are keyed by id), so it's refused too, never left to hang.
   */
  it('answers -32600 for a numeric id and for an id reused while in flight — never a silent hang', async () => {
    const parked = fakeNode('mac-a', { hangDial: true });
    const h = harness([parked]);
    h.client.send({ jsonrpc: '2.0', id: 7, method: 'allocateDevice', params: {} });
    await flush();
    expect(h.received[0]?.error?.code).toBe(-32600);

    h.client.send(allocFrame('dup')); // parks on the hanging dial
    await flush();
    h.client.send(allocFrame('dup')); // the same id, still in flight
    await flush();
    const refusals = h.received.filter((f) => f.id === 'dup');
    expect(refusals).toHaveLength(1);
    expect(refusals[0].error?.code).toBe(-32600);
    parked.releaseDial();
  });

  /**
   * @issue DTX-7008
   * A successful release makes its allocation mapping garbage; pruning it
   * keeps the one per-allocation map bounded over a long session. A verb on
   * the pruned allocation answers 2008 locally — the node never sees it.
   */
  it('prunes a released allocation\'s mapping: a later verb answers 2008 locally, the node sees nothing', async () => {
    const a = fakeNode('mac-a', {
      onFrame: (f, api) => {
        if (f.method === 'allocateDevice') api.succeed(f.id ?? '', 'alloc-1');
        if (f.method === 'releaseDevice') {
          api.send({ jsonrpc: '2.0', id: f.id, result: { released: true } });
        }
      },
    });
    const h = harness([a]);
    h.client.send(allocFrame('1'));
    await flush();
    const relayId = h.received[0].result?.allocationId as string;
    h.client.send({ jsonrpc: '2.0', id: '2', method: 'releaseDevice', params: { allocationId: relayId } });
    await flush();
    expect(h.received.find((f) => f.id === '2')?.result).toEqual({ released: true });

    h.client.send({ jsonrpc: '2.0', id: '3', method: 'bootDevice', params: { allocationId: relayId } });
    await flush();
    expect(h.received.find((f) => f.id === '3')?.error?.code).toBe(2008);
    expect(a.frames.some((f) => f.method === 'bootDevice')).toBe(false);
  });

  /**
   * @issue DTX-7017
   * `$/cancelAck` is the one notification a node can aim at a specific local
   * call, so only the node that owns the id may deliver it — a forged ack
   * from another node could settle an aborted call with a lie while the
   * real settlement is still in flight.
   */
  it('drops a $/cancelAck from a node that does not own the id — only the owner may settle a call', async () => {
    const a = fakeNode('mac-a', {
      onFrame: (f, api) => {
        if (f.method === 'allocateDevice') api.succeed(f.id ?? '', 'alloc-1');
      },
    });
    const h = harness([a]);
    h.client.send(allocFrame('1'));
    await flush();
    a.api.send({ jsonrpc: '2.0', method: '$/cancelAck', params: { id: 'foreign', outcome: 'undone' } });
    await flush();
    expect(h.received.some((f) => f.method === '$/cancelAck')).toBe(false);
  });

  it('synthesizes a $/cancelAck with outcome "unknown" for a cancel nobody remembers', async () => {
    const h = harness([fakeNode('mac-a')]);
    h.client.send({ jsonrpc: '2.0', method: '$/cancelRequest', params: { id: 'ghost' } });
    await flush();
    expect(h.received).toEqual([
      { jsonrpc: '2.0', method: '$/cancelAck', params: { id: 'ghost', outcome: 'unknown' } },
    ]);
  });

  it('refuses a request FROM a node with -32601 at the node, never bothering the client', async () => {
    const a = fakeNode('mac-a', {
      onFrame: (frame, api) => {
        if (frame.method === 'allocateDevice') api.succeed(frame.id ?? '', 'alloc-1');
      },
    });
    const h = harness([a]);
    h.client.send(allocFrame('1'));
    await flush();
    a.api.send({ jsonrpc: '2.0', id: 'node-req-1', method: 'surprise', params: {} });
    await flush();
    const refusal = a.frames.find((f) => f.id === 'node-req-1' && f.error);
    expect(refusal?.error?.code).toBe(-32601);
    expect(h.received.filter((f) => f.id === 'node-req-1')).toHaveLength(0);
  });
});

// ── Id opacity & addressing (the headline mechanical finding) ──────────────

describe('allocationId rewrite', () => {
  /**
   * @issue DTX-7030
   * `relayId` is minted opaque at the relay (`randomUUID()`), never derived
   * from the node's own allocation id or name, so nothing a client can parse
   * leaks node identity or the node-side id.
   */
  it('maps two nodes\' colliding alloc-1 to distinct opaque ids and routes verbs to the right node', async () => {
    // Both nodes mint the identical per-process id — the guaranteed collision.
    const respond = (frame: Frame, api: FakeNodeApi): void => {
      if (frame.method === 'allocateDevice') {
        const device = (frame.params?.device ?? {}) as DeviceQuery;
        api.succeed(frame.id ?? '', 'alloc-1', device.id);
      }
    };
    const a = fakeNode('mac-a', {
      onFrame: (frame, api) => {
        const device = (frame.params?.device ?? {}) as DeviceQuery;
        if (frame.method === 'allocateDevice' && device.id === 'U-A') respond(frame, api);
        else if (frame.method === 'allocateDevice') api.refuse(frame.id ?? '', 2001);
      },
    });
    const b = fakeNode('mac-b', { onFrame: respond });
    const h = harness([a, b]);

    h.client.send({ ...allocFrame('1'), params: { type: 'ios.simulator', device: { id: 'U-A' } } });
    await flush();
    h.client.send({ ...allocFrame('2'), params: { type: 'ios.simulator', device: { id: 'U-B' } } });
    await flush();

    const first = h.received.find((f) => f.id === '1')?.result;
    const second = h.received.find((f) => f.id === '2')?.result;
    const firstId = first?.allocationId as string;
    const secondId = second?.allocationId as string;
    expect(firstId).not.toBe(secondId);
    for (const relayId of [firstId, secondId]) {
      expect(relayId).toMatch(UUID_RE);
      expect(relayId).not.toContain('alloc');
      expect(relayId).not.toContain('mac-');
    }

    // Addressing: a verb on each handle lands on its node, raw id restored.
    h.client.send({ jsonrpc: '2.0', id: '3', method: 'shutdownDevice', params: { allocationId: firstId } });
    h.client.send({ jsonrpc: '2.0', id: '4', method: 'shutdownDevice', params: { allocationId: secondId } });
    await flush();
    expect(a.frames.filter((f) => f.method === 'shutdownDevice')).toHaveLength(1);
    expect(b.frames.filter((f) => f.method === 'shutdownDevice')).toHaveLength(1);
    expect(a.frames.at(-1)?.params?.allocationId).toBe('alloc-1');
    expect(b.frames.at(-1)?.params?.allocationId).toBe('alloc-1');
  });

  /**
   * @issue DTX-7015
   * The `deviceStateChanged` rewrite is done synchronously and forwarded in
   * place: an awaited lookup could let the answer that follows it on the
   * same socket overtake it, and the client's `device.state` contract
   * depends on the push staying ahead of the answer.
   */
  it('rewrites deviceStateChanged node→client and preserves push-before-answer order', async () => {
    const a = fakeNode('mac-a', {
      onFrame: (frame, api) => {
        if (frame.method === 'allocateDevice') api.succeed(frame.id ?? '', 'alloc-1');
        if (frame.method === 'shutdownDevice') {
          // The server's contract: notify before answering (same socket).
          api.send({
            jsonrpc: '2.0',
            method: 'deviceStateChanged',
            params: { allocationId: 'alloc-1', state: 'shutdown' },
          });
          api.send({ jsonrpc: '2.0', id: frame.id, result: { state: 'shutdown' } });
        }
      },
    });
    const h = harness([a]);
    h.client.send(allocFrame('1'));
    await flush();
    const relayId = h.received[0].result?.allocationId as string;

    h.client.send({ jsonrpc: '2.0', id: '2', method: 'shutdownDevice', params: { allocationId: relayId } });
    await flush();
    const tail = h.received.slice(1);
    expect(tail[0].method).toBe('deviceStateChanged');
    expect(tail[0].params?.allocationId).toBe(relayId);
    expect(tail[1].id).toBe('2');
  });

  /**
   * @issue DTX-7016
   * The server attaches its notifier just before answering `allocateDevice`,
   * so a `deviceStateChanged` in that gap arrives before the relay knows the
   * id. It's buffered (latest state per node allocation) and flushed
   * rewritten just before the adopting `allocateDevice` answer, so the
   * push-before-answer order still holds.
   */
  it('buffers a push from the allocation gap and flushes it rewritten, still before the answer', async () => {
    const a = fakeNode('mac-a', {
      onFrame: (frame, api) => {
        if (frame.method !== 'allocateDevice') return;
        api.send({
          jsonrpc: '2.0',
          method: 'deviceStateChanged',
          params: { allocationId: 'alloc-1', state: 'booted' },
        });
        api.succeed(frame.id ?? '', 'alloc-1');
      },
    });
    const h = harness([a]);
    h.client.send(allocFrame('1'));
    await flush();
    expect(h.received[0].method).toBe('deviceStateChanged');
    expect(h.received[1].id).toBe('1');
    expect(h.received[0].params?.allocationId).toBe(h.received[1].result?.allocationId);
  });
});

// ── Fan-out classification (the outcome table) ─────────────────────────────

/**
 * @issue DTX-7026
 * Only two codes short-circuit an `allocateDevice` fan-out pass: 2011 (the
 * query is bad everywhere) and the caller leaving (2003 / a raw `-32800`,
 * whose `data.outcome` must reach the client untouched). Everything else —
 * including codes newer than this build — advances to the next node:
 * advancing costs one more attempt, failing early costs the whole fleet.
 */
describe('allocation fan-out', () => {
  it('advances past a refusing node and lands on the free one', async () => {
    const full = fakeNode('mac-full', {
      onFrame: (f, api) => {
        if (f.method === 'allocateDevice') api.refuse(f.id ?? '', 2001);
      },
    });
    const free = fakeNode('mac-free', {
      onFrame: (f, api) => {
        if (f.method === 'allocateDevice') api.succeed(f.id ?? '', 'alloc-1');
      },
    });
    const h = harness([full, free]);
    h.client.send(allocFrame('1'));
    await flush();
    expect(h.received[0].result?.allocationId).toBeDefined();
  });

  it.each([
    [2001, 'pool exhausted'],
    [2002, 'no matching device'],
    [2006, 'connection lost'],
    [2007, 'session expired'],
    [2099, 'unclassified'],
    [7777, 'a code newer than this build'],
  ])('a node answering %i advances the pass (%s — the default arm)', async (code) => {
    const refusing = fakeNode('mac-a', {
      onFrame: (f, api) => {
        if (f.method === 'allocateDevice') api.refuse(f.id ?? '', code);
      },
    });
    const free = fakeNode('mac-b', {
      onFrame: (f, api) => {
        if (f.method === 'allocateDevice') api.succeed(f.id ?? '', 'alloc-1');
      },
    });
    const h = harness([refusing, free]);
    h.client.send(allocFrame('1'));
    await flush();
    expect(h.received[0].result).toBeDefined();
  });

  it('an unreachable node (dial failure) advances the pass', async () => {
    const dead = fakeNode('mac-dead', { dialError: new Error('ECONNREFUSED') });
    const free = fakeNode('mac-b', {
      onFrame: (f, api) => {
        if (f.method === 'allocateDevice') api.succeed(f.id ?? '', 'alloc-1');
      },
    });
    const h = harness([dead, free]);
    h.client.send(allocFrame('1'));
    await flush();
    expect(h.received[0].result).toBeDefined();
  });

  it('2011 fails NOW — forwarded verbatim, later nodes never dialed', async () => {
    const judging = fakeNode('mac-a', {
      onFrame: (f, api) => {
        if (f.method === 'allocateDevice') api.refuse(f.id ?? '', 2011, { field: 'device' });
      },
    });
    const never = fakeNode('mac-b');
    const h = harness([judging, never]);
    h.client.send(allocFrame('1'));
    await flush();
    expect(h.received[0].error?.code).toBe(2011);
    expect(h.received[0].error?.message).toBe('refused by mac-a'); // verbatim, not re-worded
    expect(h.received[0].error?.data).toEqual({ field: 'device' });
    expect(never.connects).toBe(0);
  });

  it('a -32800 answer (the caller left) fails NOW, its outcome untouched', async () => {
    const a = fakeNode('mac-a', {
      onFrame: (f, api) => {
        if (f.method === 'allocateDevice') api.refuse(f.id ?? '', -32800, { outcome: 'undone' });
      },
    });
    const never = fakeNode('mac-b');
    const h = harness([a, never]);
    h.client.send(allocFrame('1'));
    await flush();
    expect(h.received[0].error?.code).toBe(-32800);
    expect(h.received[0].error?.data).toEqual({ outcome: 'undone' });
    expect(never.connects).toBe(0);
  });

  /**
   * @issue DTX-7027
   * A 2005 (bad node token) must not down the fleet — it advances the
   * fan-out like any other non-short-circuit code — and must not hide: it's
   * logged loudly and named in the aggregate.
   */
  it('2005 advances but is logged loudly and named in the aggregate', async () => {
    const misconfigured = fakeNode('mac-a', {
      onFrame: (f, api) => {
        if (f.method === 'allocateDevice') api.refuse(f.id ?? '', 2005);
      },
    });
    const full = fakeNode('mac-b', {
      onFrame: (f, api) => {
        if (f.method === 'allocateDevice') api.refuse(f.id ?? '', 2001);
      },
    });
    const h = harness([misconfigured, full]);
    h.client.send(allocFrame('1'));
    await flush();
    expect(h.logs.some((line) => line.includes('mac-a') && line.includes('2005'))).toBe(true);
    expect(h.received[0].error?.code).toBe(2001); // mixed → exhausted
    const nodes = h.received[0].error?.data as AggregateData;
    expect(nodes.nodes).toMatchObject([
      { node: 'mac-a', code: 2005 },
      { node: 'mac-b', code: 2001 },
    ]);
  });

  /**
   * @issue DTX-7002
   * `holders` is node-local display data (a device's current owner, as
   * that node understands it) — passed through opaque rather than
   * remapped into relay-facing ids, because a relay id for an allocation
   * the relay never issued would look actionable when it isn't.
   */
  it('all-2002 collapses to 2002; holders pass through opaque; config order holds', async () => {
    const refuse2002 = (name: string, holders?: unknown): FakeNode =>
      fakeNode(name, {
        onFrame: (f, api) => {
          if (f.method === 'allocateDevice') {
            api.refuse(f.id ?? '', 2002, holders !== undefined ? { holders } : undefined);
          }
        },
      });
    const holders = [{ allocationId: 'alloc-7', udid: 'u-7', ageMs: 5 }];
    const h = harness([refuse2002('mac-a', holders), refuse2002('mac-b')]);
    h.client.send(allocFrame('1'));
    await flush();
    expect(h.received[0].error?.code).toBe(2002);
    const data = h.received[0].error?.data as OpaqueNodesData;
    expect(data.nodes.map((n) => n.node)).toEqual(['mac-a', 'mac-b']);
    expect(data.nodes[0].holders).toEqual(holders);
    expect(data.nodes[1].holders).toBeUndefined();
  });

  /**
   * @issue DTX-7031
   * All-2005 is the one non-2002 exception in the aggregate: a 2001 here
   * would tell the client "full, retry" forever while only the relay's log
   * knew the truth. Terminal for the caller, actionable for the operator —
   * this inverts the per-host "terminal beats transient" ranking
   * across a fleet, where transient-anywhere beats terminal-elsewhere.
   */
  it('all-2005 surfaces as 2005 naming the RELAY\'s node credentials, not as "full, retry"', async () => {
    const rejecting = (name: string): FakeNode =>
      fakeNode(name, {
        onFrame: (f, api) => {
          if (f.method === 'allocateDevice') api.refuse(f.id ?? '', 2005);
        },
      });
    const h = harness([rejecting('mac-a'), rejecting('mac-b')]);
    h.client.send(allocFrame('1'));
    await flush();
    expect(h.received[0].error?.code).toBe(2005);
    expect(h.received[0].error?.message).toMatch(/--nodes|node credentials/);
  });

  /**
   * @issue DTX-7001
   * `ALLOCATION_STALL_MS` is a wedge detector, not a patience limit: no
   * frame from a node — neither answer nor `$/progress` — for this long
   * abandons the attempt (counts as unreachable, tries the next node). A
   * node can be wedged with its socket up, a death otherwise unobservable.
   *
   * @issue DTX-7025
   * Abandoning is not cancelling the node's work: a best-effort
   * `$/cancelRequest` still goes out so a merely-slow node rolls back
   * instead of stranding a device it thinks the relay still owns.
   */
  it('abandons a stalled attempt after 30 s, sends a best-effort cancel, and advances', async () => {
    vi.useFakeTimers();
    const wedged = fakeNode('mac-wedged'); // accepts, never answers
    const free = fakeNode('mac-b', {
      onFrame: (f, api) => {
        if (f.method === 'allocateDevice') api.succeed(f.id ?? '', 'alloc-1');
      },
    });
    const h = harness([wedged, free]);
    h.client.send(allocFrame('1'));
    await vi.advanceTimersByTimeAsync(ALLOCATION_STALL_MS + 1);
    await vi.advanceTimersByTimeAsync(1);
    expect(wedged.frames.some((f) => f.method === '$/cancelRequest')).toBe(true);
    expect(h.received[0].result).toBeDefined(); // mac-b answered
  });

  /**
   * @issue DTX-7023
   * The stall clock covers the whole attempt including the dial: a SYN
   * blackhole wedges exactly like a wedged process, and nothing below the
   * relay has a timeout to save the fan-out. A node whose handshake never
   * completes must cost one abandoned attempt, not the whole call.
   */
  it('a wedged DIAL is abandoned by the same stall clock — the fan-out advances, never parks', async () => {
    vi.useFakeTimers();
    const parked = fakeNode('mac-parked', { hangDial: true });
    const free = fakeNode('mac-b', {
      onFrame: (f, api) => {
        if (f.method === 'allocateDevice') api.succeed(f.id ?? '', 'alloc-1');
      },
    });
    const h = harness([parked, free]);
    h.client.send(allocFrame('1'));
    await vi.advanceTimersByTimeAsync(ALLOCATION_STALL_MS + 1);
    await vi.advanceTimersByTimeAsync(1);
    expect(h.received[0]?.result).toBeDefined();
    // The abandoned node must never have been dispatched to.
    expect(parked.frames).toHaveLength(0);
  });

  /**
   * @issue DTX-7024
   * A still-pending dial is forgotten on abandon (generation-aware: clearing
   * `up.connecting` lets the next attempt re-dial fresh), so a socket that
   * completes later is closed, never adopted — a fresh dial may already own
   * the slot by then.
   */
  it('a dial resolving AFTER its attempt was abandoned is closed, never adopted', async () => {
    vi.useFakeTimers();
    const parked = fakeNode('mac-parked', { hangDial: true });
    const free = fakeNode('mac-b', {
      onFrame: (f, api) => {
        if (f.method === 'allocateDevice') api.succeed(f.id ?? '', 'alloc-1');
      },
    });
    const h = harness([parked, free]);
    h.client.send(allocFrame('1'));
    await vi.advanceTimersByTimeAsync(ALLOCATION_STALL_MS + 2);
    expect(h.received[0]?.result).toBeDefined(); // settled via mac-b
    parked.releaseDial(); // the wedged handshake completes minutes later
    await vi.advanceTimersByTimeAsync(1);
    expect(parked.nodeSideClosed).toBe(true); // the corpse is buried
    expect(parked.frames.filter((f) => f.method === 'allocateDevice')).toHaveLength(0);
  });

  /**
   * @issue DTX-7029
   * The aggregate's outcome message is built from the node's configured
   * name and the error code alone, never from the dial error's own text —
   * which names the node's URL. Nothing about a node beyond its
   * operator-chosen name may reach a client.
   */
  it('a dial refusal never leaks the node\'s URL into the aggregate a client reads', async () => {
    const dead = fakeNode('mac-dead', {
      dialError: new Error('could not connect to node "mac-dead" at ws://10.0.0.42:8099'),
    });
    const full = fakeNode('mac-full', {
      onFrame: (f, api) => {
        if (f.method === 'allocateDevice') api.refuse(f.id ?? '', 2001);
      },
    });
    const h = harness([dead, full]);
    h.client.send(allocFrame('1'));
    await flush();
    const aggregate = h.received.find((f) => f.id === '1');
    expect(aggregate?.error?.code).toBe(2001);
    const wire = JSON.stringify(aggregate);
    expect(wire).not.toContain('10.0.0.42'); // fleet addressing is not the client's business
    expect(wire).toContain('mac-dead'); // the configured NAME is the one thing allowed to leak
  });

  it('a node narrating within the window is alive and is never killed', async () => {
    vi.useFakeTimers();
    let allocId: string | undefined;
    const slow = fakeNode('mac-slow', {
      onFrame: (f) => {
        if (f.method === 'allocateDevice') allocId = f.id;
      },
    });
    const h = harness([slow]);
    h.client.send(allocFrame('1'));
    await vi.advanceTimersByTimeAsync(ALLOCATION_STALL_MS - 5_000);
    // 25 s in: the node speaks — the wedge detector must re-arm.
    slow.api.send({ jsonrpc: '2.0', method: '$/progress', params: { token: allocId, value: { op: 'boot', kind: 'progress' } } });
    await vi.advanceTimersByTimeAsync(ALLOCATION_STALL_MS - 5_000);
    // 25 s after the narration (50 s total): still inside the re-armed window.
    slow.api.succeed(allocId ?? '', 'alloc-1');
    await vi.advanceTimersByTimeAsync(1);
    const response = h.received.find((f) => f.id === '1');
    expect(response?.result).toBeDefined();
    expect(h.received.some((f) => f.method === '$/progress')).toBe(true);
  });
});

// ── Cancellation across the hop ────────────────────────────────────────────

describe('cancellation', () => {
  it('forwards $/cancelRequest to the node running the attempt and its -32800 back', async () => {
    let pendingId: string | undefined;
    const a = fakeNode('mac-a', {
      onFrame: (f, api) => {
        if (f.method === 'allocateDevice') pendingId = f.id;
        if (f.method === '$/cancelRequest') {
          api.refuse((f.params as unknown as CancelParams).id, -32800, { outcome: 'undone' });
        }
      },
    });
    const h = harness([a]);
    h.client.send(allocFrame('1'));
    await flush();
    expect(pendingId).toBe('1');
    h.client.send({ jsonrpc: '2.0', method: '$/cancelRequest', params: { id: '1' } });
    await flush();
    expect(a.frames.some((f) => f.method === '$/cancelRequest')).toBe(true);
    expect(h.received[0].error?.code).toBe(-32800);
    expect(h.received[0].error?.data).toEqual({ outcome: 'undone' });
  });

  /**
   * @issue DTX-7028
   * A cancel that lands while no node holds the call — here, during a dial —
   * has nothing sent to compensate: nothing was ever dispatched. The relay
   * answers the pairing itself with -32800/nothing-to-undo; the client
   * keeps no clock of its own to wait out.
   */
  it('answers -32800 {nothing-to-undo} itself when the cancel lands while the relay holds the call', async () => {
    const parked = fakeNode('mac-a', { hangDial: true });
    const h = harness([parked]);
    h.client.send(allocFrame('1'));
    await flush();
    h.client.send({ jsonrpc: '2.0', method: '$/cancelRequest', params: { id: '1' } });
    await flush();
    parked.releaseDial();
    await flush();
    expect(h.received[0].error?.code).toBe(-32800);
    expect(h.received[0].error?.data).toEqual({ outcome: 'nothing-to-undo' });
    // Nothing was dispatched to the node — there was nothing to compensate.
    expect(parked.frames.filter((f) => f.method === 'allocateDevice')).toHaveLength(0);
  });

  /**
   * @issue DTX-7007
   * Until the frame physically leaves for the node, the relay holds the
   * call: a cancel arriving in that window (a build push, here) is answered
   * locally instead of waiting out the queue. The client has no clock of
   * its own to wait out a multi-minute push it is trying to stop.
   */
  it('a cancel for a verb still parked behind a build push settles INSTANTLY and the verb is never dispatched', async () => {
    let releaseEnsure: (outcome: EnsureBlobOutcome) => void = () => undefined;
    const a = fakeNode('mac-a', {
      onFrame: (f, api) => {
        if (f.method === 'allocateDevice') api.succeed(f.id ?? '', 'alloc-1');
      },
      ensureBlob: () =>
        new Promise<EnsureBlobOutcome>((resolve) => {
          releaseEnsure = resolve;
        }),
    });
    const h = harness([a]);
    h.client.send(allocFrame('1'));
    await flush();
    const relayId = h.received[0].result?.allocationId as string;
    h.client.send({
      jsonrpc: '2.0',
      id: '2',
      method: 'installApp',
      params: { allocationId: relayId, blob: { algo: 'sha256', hex: HEX } },
    });
    await flush();
    h.client.send({ jsonrpc: '2.0', method: '$/cancelRequest', params: { id: '2' } });
    await flush();
    // Settled BEFORE the push completes — the relay held the call, so it
    // answers the pairing itself with the one truthful outcome.
    const settlement = h.received.find((f) => f.id === '2');
    expect(settlement?.error?.code).toBe(-32800);
    expect(settlement?.error?.data).toEqual({ outcome: 'nothing-to-undo' });

    releaseEnsure({ ok: true }); // the push finishes into a cancelled call
    await flush();
    expect(a.frames.some((f) => f.method === 'installApp')).toBe(false);
    expect(h.received.filter((f) => f.id === '2')).toHaveLength(1); // no double answer
  });

  it('routes a LATE cancel to the node that answered (its retention runs the undo) and forwards the ack', async () => {
    const a = fakeNode('mac-a', {
      onFrame: (f, api) => {
        if (f.method === 'allocateDevice') api.succeed(f.id ?? '', 'alloc-1');
        if (f.method === '$/cancelRequest') {
          api.send({
            jsonrpc: '2.0',
            method: '$/cancelAck',
            params: { id: (f.params as unknown as CancelParams).id, outcome: 'undone' },
          });
        }
      },
    });
    const h = harness([a]);
    h.client.send(allocFrame('1'));
    await flush();
    h.client.send({ jsonrpc: '2.0', method: '$/cancelRequest', params: { id: '1' } });
    await flush();
    const ack = h.received.find((f) => f.method === '$/cancelAck');
    expect(ack?.params).toEqual({ id: '1', outcome: 'undone' });
  });
});

// ── Sessions, leases, death ────────────────────────────────────────────────

describe('upstream death', () => {
  async function allocatedHarness(): Promise<{ h: Harness; a: FakeNode; relayId: string }> {
    const a = fakeNode('mac-a', {
      onFrame: (f, api) => {
        if (f.method === 'allocateDevice') api.succeed(f.id ?? '', 'alloc-1');
      },
    });
    const h = harness([a]);
    h.client.send(allocFrame('1'));
    await flush();
    const relayId = h.received[0].result?.allocationId as string;
    return { h, a, relayId };
  }

  /**
   * @issue DTX-7021
   * Upstream death settles every call it stranded with 2006, including one
   * still waiting for its `$/cancelAck` — the client keeps no clock of its
   * own, so this is the settlement it otherwise couldn't get.
   * The settlement never names the node: which node an opaque handle lived
   * on is topology, and the operator reads that off the loss log instead.
   */
  it('settles in-flight calls with 2006 — including an aborted call waiting for its ack', async () => {
    const { h, a, relayId } = await allocatedHarness();
    h.client.send({ jsonrpc: '2.0', id: '2', method: 'bootDevice', params: { allocationId: relayId } });
    await flush();
    h.client.send({ jsonrpc: '2.0', method: '$/cancelRequest', params: { id: '2' } });
    await flush();
    a.die();
    await flush();
    const settlement = h.received.find((f) => f.id === '2');
    expect(settlement?.error?.code).toBe(2006);
    expect(JSON.stringify(settlement)).not.toContain('mac-a');
    expect(h.logs.some((l) => l.includes('mac-a'))).toBe(true);
  });

  /**
   * @issue DTX-7020
   * Routing state is cleared before the loss is logged: once the log line
   * fires, a verb on this node's allocations already answers 2008
   * deterministically — flipping after the log would make a correct
   * implementation flake under a log-gated wait.
   */
  it('flips routing state BEFORE the loss log line: at log time a stale verb already answers 2008', async () => {
    const probes: Frame[] = [];
    const a = fakeNode('mac-a', {
      onFrame: (f, api) => {
        if (f.method === 'allocateDevice') api.succeed(f.id ?? '', 'alloc-1');
      },
    });
    const [relayEnd, clientEnd] = memoryChannel();
    clientEnd.onMessage((msg) => probes.push(msg as Frame));
    let logSeen = false;
    let codeAtLogTime: number | undefined;
    new RelaySession({
      client: relayEnd,
      nodes: [a.node],
      logError: (line) => {
        if (!/lost connection/.test(line)) return;
        logSeen = true;
        // Synchronously, from inside the log call.
        const before = probes.length;
        clientEnd.send({
          jsonrpc: '2.0',
          id: 'probe',
          method: 'bootDevice',
          params: { allocationId: probes[0].result?.allocationId },
        });
        codeAtLogTime = probes[before]?.error?.code;
      },
    });
    clientEnd.send(allocFrame('1'));
    await flush();
    a.die();
    await flush();
    expect(logSeen).toBe(true);
    expect(codeAtLogTime).toBe(2008);
  });

  it('a fan-out attempt on a dying node advances to the next node', async () => {
    const dying = fakeNode('mac-a'); // accepts the frame, then the process dies
    const free = fakeNode('mac-b', {
      onFrame: (f, api) => {
        if (f.method === 'allocateDevice') api.succeed(f.id ?? '', 'alloc-1');
      },
    });
    const h = harness([dying, free]);
    h.client.send(allocFrame('1'));
    await flush();
    dying.die();
    await flush();
    expect(h.received[0].result).toBeDefined();
    expect(h.logs.some((l) => l.includes('mac-a'))).toBe(true);
  });

  it('the surviving node is untouched by its sibling\'s death', async () => {
    const respond = (f: Frame, api: FakeNodeApi): void => {
      if (f.method === 'allocateDevice') api.succeed(f.id ?? '', 'alloc-1');
      if (f.method === 'shutdownDevice') api.send({ jsonrpc: '2.0', id: f.id, result: { state: 'shutdown' } });
    };
    const a = fakeNode('mac-a', {
      onFrame: (f, api) => {
        const device = (f.params?.device ?? {}) as DeviceQuery;
        if (f.method === 'allocateDevice' && device.id !== 'U-A') api.refuse(f.id ?? '', 2001);
        else respond(f, api);
      },
    });
    const b = fakeNode('mac-b', { onFrame: respond });
    const h = harness([a, b]);
    h.client.send({ ...allocFrame('1'), params: { type: 'ios.simulator', device: { id: 'U-A' } } });
    await flush();
    h.client.send({ ...allocFrame('2'), params: { type: 'ios.simulator', device: { id: 'U-B' } } });
    await flush();
    const survivorId = h.received.find((f) => f.id === '2')?.result?.allocationId as string;

    a.die();
    await flush();
    h.client.send({ jsonrpc: '2.0', id: '3', method: 'shutdownDevice', params: { allocationId: survivorId } });
    await flush();
    expect(h.received.find((f) => f.id === '3')?.result).toEqual({ state: 'shutdown' });
  });
});

describe('client goodbye', () => {
  /**
   * @issue DTX-7013
   * Client close is immediate and unconditional: the upstream closes are
   * what fire each node's own reclaim. No grace window, no park — under a
   * relay, "grace" would mean literally not closing these sockets, which
   * is the one thing a departing client cannot want.
   */
  it('closes every upstream socket immediately — the close IS what frees the farm', async () => {
    const a = fakeNode('mac-a', {
      onFrame: (f, api) => {
        if (f.method === 'allocateDevice') api.succeed(f.id ?? '', 'alloc-1');
      },
    });
    const h = harness([a]);
    h.client.send(allocFrame('1'));
    await flush();
    expect(a.nodeSideClosed).toBe(false);
    h.closeClient();
    expect(a.nodeSideClosed).toBe(true); // same tick — no grace timer exists
  });

  it('session.close() (the relay shutting down) closes the client hop too', async () => {
    const a = fakeNode('mac-a');
    const h = harness([a]);
    let clientClosed = false;
    h.client.onClose(() => {
      clientClosed = true;
    });
    h.session.close();
    expect(clientClosed).toBe(true);
  });

  /**
   * @issue DTX-7014
   * A dial still in flight when the client closes needs no special
   * handling: `#ensureConnected`'s own resolution path sees the session
   * closed, closes the late-arriving socket itself, and its rejection
   * lands wherever the floating attempt task already handles a failed
   * dial.
   */
  it('a goodbye during an upstream DIAL still closes the late-arriving socket', async () => {
    const parked = fakeNode('mac-a', { hangDial: true });
    const h = harness([parked]);
    h.client.send(allocFrame('1'));
    await flush();
    h.closeClient();
    parked.releaseDial(); // the dial completes into a session already gone
    await flush();
    expect(parked.nodeSideClosed).toBe(true);
  });

  it('a dial REJECTING after the goodbye is swallowed, not an unhandled rejection', async () => {
    let rejectDial: (err: Error) => void = () => undefined;
    const node: SessionNode = {
      name: 'mac-a',
      connect: () =>
        new Promise((_resolve, reject) => {
          rejectDial = reject;
        }),
      ensureBlob: () => Promise.resolve({ ok: true }),
    };
    const [relayEnd, clientEnd] = memoryChannel();
    new RelaySession({ client: relayEnd, nodes: [node], logError: () => undefined });
    clientEnd.send(allocFrame('1'));
    await flush();
    clientEnd.close();
    rejectDial(new Error('dial died after the client left'));
    await flush(); // an unhandled rejection here would fail the test run
  });
});

describe('channel errors', () => {
  it('logs client- and upstream-channel errors without dying', async () => {
    const [relayInner, clientEnd] = memoryChannel();
    const client = errableChannel(relayInner);
    let fireUpstreamError: (err: Error) => void = () => undefined;
    const node: SessionNode = {
      name: 'mac-a',
      connect: () => {
        const [relayEnd, nodeEnd] = memoryChannel();
        nodeEnd.onMessage((msg) => {
          const frame = msg as Frame;
          if (frame.method === 'allocateDevice') {
            nodeEnd.send({ jsonrpc: '2.0', id: frame.id, error: { code: 2001, message: 'full' } });
          }
        });
        const errable = errableChannel(relayEnd);
        fireUpstreamError = errable.fireError;
        return Promise.resolve(errable.channel);
      },
      ensureBlob: () => Promise.resolve({ ok: true }),
    };
    const logs: string[] = [];
    new RelaySession({
      client: client.channel,
      nodes: [node],
      logError: (line) => {
        logs.push(line);
      },
    });
    clientEnd.send(allocFrame('1'));
    await flush();
    client.fireError(new Error('client serialize failure'));
    fireUpstreamError(new Error('upstream serialize failure'));
    expect(logs.some((l) => l.includes('client channel error'))).toBe(true);
    expect(logs.some((l) => l.includes('mac-a') && l.includes('channel error'))).toBe(true);
  });

  it('logs a forwarding task that throws (the enqueue catch) instead of breaking the queue', async () => {
    const a = fakeNode('mac-a', {
      onFrame: (f, api) => {
        if (f.method === 'allocateDevice') api.succeed(f.id ?? '', 'alloc-1');
      },
      ensureBlob: () => Promise.reject(new Error('bridge exploded')),
    });
    const h = harness([a]);
    h.client.send(allocFrame('1'));
    await flush();
    const relayId = h.received[0].result?.allocationId as string;
    h.client.send({
      jsonrpc: '2.0',
      id: '2',
      method: 'installApp',
      params: { allocationId: relayId, blob: { algo: 'sha256', hex: HEX } },
    });
    await flush();
    expect(h.logs.some((l) => l.includes('forwarding toward node') && l.includes('bridge exploded'))).toBe(true);
    // The queue survives: a later verb still forwards.
    h.client.send({ jsonrpc: '2.0', id: '3', method: 'bootDevice', params: { allocationId: relayId } });
    await flush();
    expect(a.frames.some((f) => f.method === 'bootDevice')).toBe(true);
  });
});

// ── The blob lane crosses hop-by-hop ───────────────────────────────────────

describe('installApp {blob} bridge', () => {
  async function withAllocation(node: FakeNode): Promise<{ h: Harness; relayId: string }> {
    const h = harness([node]);
    h.client.send(allocFrame('1'));
    await flush();
    const relayId = h.received[0].result?.allocationId as string;
    return { h, relayId };
  }

  const succeedAlloc = (f: Frame, api: FakeNodeApi): void => {
    if (f.method === 'allocateDevice') api.succeed(f.id ?? '', 'alloc-1');
  };

  /**
   * @issue DTX-7003
   * Client→node forwarding is FIFO per node: the blob bridge makes
   * `installApp` an async send, and everything queued behind it (`bootDevice`
   * here) must not overtake it.
   *
   * @issue DTX-7009
   * The blob lane crosses hop-by-hop: stage the bytes on the
   * node first, then forward the verb unchanged.
   */
  it('stages the blob on the node before forwarding, and keeps the per-node FIFO order', async () => {
    let releaseEnsure: (outcome: EnsureBlobOutcome) => void = () => undefined;
    const a = fakeNode('mac-a', {
      onFrame: succeedAlloc,
      ensureBlob: () =>
        new Promise<EnsureBlobOutcome>((resolve) => {
          releaseEnsure = resolve;
        }),
    });
    const { h, relayId } = await withAllocation(a);

    h.client.send({
      jsonrpc: '2.0',
      id: '2',
      method: 'installApp',
      params: { allocationId: relayId, blob: { algo: 'sha256', hex: HEX } },
    });
    h.client.send({ jsonrpc: '2.0', id: '3', method: 'bootDevice', params: { allocationId: relayId } });
    await flush();
    expect(a.frames.some((f) => f.method === 'installApp')).toBe(false);
    expect(a.frames.some((f) => f.method === 'bootDevice')).toBe(false);
    expect(a.ensureBlobCalls).toEqual([HEX]);

    releaseEnsure({ ok: true });
    await flush();
    const methods = a.frames.map((f) => f.method).filter((m) => m === 'installApp' || m === 'bootDevice');
    expect(methods).toEqual(['installApp', 'bootDevice']);
    expect(a.frames.find((f) => f.method === 'installApp')?.params?.allocationId).toBe('alloc-1');
  });

  it('answers 2016 with the bridge\'s reason when staging fails — the node never sees the verb', async () => {
    const a = fakeNode('mac-a', {
      onFrame: succeedAlloc,
      ensureBlob: () => Promise.resolve({ ok: false, reason: 'evicted, re-upload' }),
    });
    const { h, relayId } = await withAllocation(a);
    h.client.send({
      jsonrpc: '2.0',
      id: '2',
      method: 'installApp',
      params: { allocationId: relayId, blob: { algo: 'sha256', hex: HEX } },
    });
    await flush();
    const answer = h.received.find((f) => f.id === '2');
    expect(answer?.error?.code).toBe(2016);
    expect(answer?.error?.message).toContain('evicted, re-upload');
    expect(a.frames.some((f) => f.method === 'installApp')).toBe(false);
  });

  /**
   * @issue DTX-7010
   * A malformed blob skips the bridge and forwards untouched: judging
   * arguments is the node's job, not the relay's — the node itself answers
   * 2011 for a blob shape it can't use.
   */
  it('forwards a malformed blob untouched — judging arguments is the node\'s job (2011 lives there)', async () => {
    const a = fakeNode('mac-a', { onFrame: succeedAlloc });
    const { h, relayId } = await withAllocation(a);
    h.client.send({
      jsonrpc: '2.0',
      id: '2',
      method: 'installApp',
      params: { allocationId: relayId, blob: { algo: 'md5', hex: 'zz' } },
    });
    await flush();
    expect(a.ensureBlobCalls).toEqual([]);
    expect(a.frames.some((f) => f.method === 'installApp')).toBe(true);
  });

  it('the URL form forwards untouched — the NODE fetches it (spec 003, unchanged)', async () => {
    const a = fakeNode('mac-a', { onFrame: succeedAlloc });
    const { h, relayId } = await withAllocation(a);
    h.client.send({
      jsonrpc: '2.0',
      id: '2',
      method: 'installApp',
      params: { allocationId: relayId, appPath: 'https://builds.example/app.zip' },
    });
    await flush();
    expect(a.ensureBlobCalls).toEqual([]);
    expect(a.frames.find((f) => f.method === 'installApp')?.params?.appPath).toBe(
      'https://builds.example/app.zip',
    );
  });
});
