import { describe, it, expect, vi } from 'vitest';

import { Peer } from '../peer';
import type { Channel, CloseHandler, MessageHandler } from '../channel';

/**
 * Peer-level cancellation: what happens when a `$/cancelRequest` and the
 * response to that request cross on the wire (race R2), and what the rollback
 * ledger behind `ctx.onUndo` does about it.
 *
 * The race that is *not* here is R1 — "cancelled while the handler was still
 * working" — beyond the one test that pins its behaviour as unchanged. That
 * one is closed by the responder aborting the handler's signal and answering
 * `-32800`, and its device-level consequences are gated server-side
 * (`packages/server/src/__tests__/cancellation.test.ts`).
 */

/** Every frame shape these tests read; `Peer` writes plain JSON-RPC objects. */
interface Frame {
  jsonrpc: '2.0';
  id?: string;
  method?: string;
  params?: { id?: string; outcome?: string; token?: string };
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

interface Wire {
  clientChannel: Channel;
  serverChannel: Channel;
  /** Frames delivered to the client, in delivery order. */
  seenByClient: Frame[];
  /** Frames delivered to the server, in delivery order. */
  seenByServer: Frame[];
  /** Parks everything the server sends until {@link Wire.release}. */
  hold(): void;
  release(): void;
  closeBoth(): void;
  /** Injects a raw frame at the server, bypassing the client `Peer`. */
  sendToServer(frame: Frame): void;
  /** Injects a raw frame at the client, bypassing the server `Peer`. */
  sendToClient(frame: Frame): void;
}

/**
 * A channel pair whose server→client direction can be held.
 *
 * Deliberately not `memoryChannel`, which delivers inside `send()`: a response
 * and an abort can never cross there, so race R2 — the entire subject of this
 * file — is unstageable on it. Holding one direction is what makes "the answer
 * is already written, the caller has already walked away" a deterministic
 * fixture instead of a timing accident.
 */
function makeWire(): Wire {
  const clientHandlers: MessageHandler[] = [];
  const serverHandlers: MessageHandler[] = [];
  const clientCloseHandlers: CloseHandler[] = [];
  const serverCloseHandlers: CloseHandler[] = [];
  const seenByClient: Frame[] = [];
  const seenByServer: Frame[] = [];
  const parked: Frame[] = [];
  let holding = false;

  const toServer = (frame: Frame) => {
    seenByServer.push(frame);
    for (const handler of [...serverHandlers]) handler(frame);
  };

  const toClient = (frame: Frame) => {
    seenByClient.push(frame);
    for (const handler of [...clientHandlers]) handler(frame);
  };

  const clientChannel: Channel = {
    send: (msg) => toServer(msg as Frame),
    onMessage: (handler) => {
      clientHandlers.push(handler);
    },
    onClose: (handler) => {
      clientCloseHandlers.push(handler);
    },
    onError: () => {},
  };

  const serverChannel: Channel = {
    send: (msg) => {
      const frame = msg as Frame;
      if (holding) parked.push(frame);
      else toClient(frame);
    },
    onMessage: (handler) => {
      serverHandlers.push(handler);
    },
    onClose: (handler) => {
      serverCloseHandlers.push(handler);
    },
    onError: () => {},
  };

  return {
    clientChannel,
    serverChannel,
    seenByClient,
    seenByServer,
    hold: () => {
      holding = true;
    },
    release: () => {
      holding = false;
      for (const frame of parked.splice(0, parked.length)) toClient(frame);
    },
    closeBoth: () => {
      for (const handler of [...clientCloseHandlers]) handler();
      for (const handler of [...serverCloseHandlers]) handler();
    },
    sendToServer: (frame) => toServer(frame),
    sendToClient: (frame) => toClient(frame),
  };
}

interface Watched {
  settled: boolean;
  error?: { name?: string; cause?: unknown; details?: Record<string, unknown> };
}

/**
 * Watches a promise without ever leaving a rejection unhandled — these tests
 * assert on a promise that must stay *pending* for a while, and an unhandled
 * rejection in between would kill the worker rather than fail a test.
 */
function watch(promise: Promise<unknown>): Watched {
  const state: Watched = { settled: false };
  void promise.then(
    () => {
      state.settled = true;
    },
    (error) => {
      state.settled = true;
      state.error = error as Watched['error'];
    },
  );
  return state;
}

/** Lets every queued microtask and macrotask-0 run. */
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

/** The same, on a fake clock: `advanceTimersByTimeAsync` drains microtasks too. */
const fakeTick = () => vi.advanceTimersByTimeAsync(1);

function acksIn(frames: Frame[]): Frame[] {
  return frames.filter((frame) => frame.method === '$/cancelAck');
}

describe('a cancellation that arrived after the answer (race R2)', () => {
  /**
   * @issue DTX-1003
   * A response can be written and parked (behind a held channel, say) before
   * the caller aborts. When it finally arrives, a stale successful answer
   * must not settle the call — the remote side still believes it handed
   * something over. The rejection waits for `$/cancelAck` to say what became
   * of it, or for the channel to close.
   */
  it('rolls the answer back and reports `undone`', async () => {
    const wire = makeWire();
    const server = Peer.create(wire.serverChannel);
    const client = Peer.create(wire.clientChannel);
    const rolledBack: string[] = [];

    server.onRequest({
      method: 'allocateDevice',
      handler: async (_params, ctx) => {
        ctx.onUndo(() => {
          rolledBack.push('device returned to the pool');
        });
        return { allocationId: 'alloc-1', udid: 'udid-1' };
      },
    });

    // The answer is written but not delivered — the caller is about to walk
    // away from a device it will never see.
    wire.hold();
    const ac = new AbortController();
    const call = client.request({ method: 'allocateDevice', signal: ac.signal });
    const watched = watch(call);
    await tick();

    const reason = new Error('the suite gave up on this allocation');
    ac.abort(reason);
    await tick();

    expect(rolledBack).toEqual(['device returned to the pool']);
    expect(watched.settled).toBe(false);

    wire.release();
    await tick();

    expect(watched.error?.name).toBe('AbortError');
    expect(watched.error?.cause).toBe(reason);
    expect(watched.error?.details).toEqual({ outcome: 'undone' });
  });

  it('reports `nothing-to-undo` for a handler that registered no compensation', async () => {
    const wire = makeWire();
    const server = Peer.create(wire.serverChannel);
    const client = Peer.create(wire.clientChannel);

    server.onRequest({ method: 'currentStatus', handler: async () => ({ status: 'idle' }) });

    wire.hold();
    const ac = new AbortController();
    const watched = watch(client.request({ method: 'currentStatus', signal: ac.signal }));
    await tick();
    ac.abort();
    await tick();
    wire.release();
    await tick();

    expect(watched.error?.details).toEqual({ outcome: 'nothing-to-undo' });
  });

  /**
   * @issue DTX-1001
   * The undo stack unwinds LIFO — the last effect to happen is the first
   * taken back, the only order under which each compensation still sees the
   * world its own effect left behind — and one failing compensation does not
   * strand the ones registered under it: a half-unwound stack is worse than
   * a fully attempted one.
   */
  it('unwinds LIFO, finishes the stack when one step throws, and reports `undo-failed`', async () => {
    const wire = makeWire();
    const server = Peer.create(wire.serverChannel);
    const client = Peer.create(wire.clientChannel);
    const order: string[] = [];
    const reported: Error[] = [];
    server.onError((error) => reported.push(error));

    server.onRequest({
      method: 'allocateDevice',
      handler: async (_params, ctx) => {
        ctx.onUndo(() => {
          order.push('free the slot');
        });
        ctx.onUndo(() => {
          order.push('shut the simulator down');
          throw new Error('simctl shutdown refused');
        });
        ctx.onUndo(() => {
          order.push('stop the state watcher');
        });
        return { allocationId: 'alloc-1' };
      },
    });

    wire.hold();
    const ac = new AbortController();
    const watched = watch(client.request({ method: 'allocateDevice', signal: ac.signal }));
    await tick();
    ac.abort();
    await tick();
    wire.release();
    await tick();

    expect(order).toEqual(['stop the state watcher', 'shut the simulator down', 'free the slot']);
    expect(watched.error?.details).toEqual({ outcome: 'undo-failed' });
    expect(reported.map((error) => error.message)).toEqual(['simctl shutdown refused']);
  });

  /**
   * @issue DTX-1000
   * A rollback runs at most once, no matter how many callers reach it. There
   * are two entry points — the handler settling unsuccessfully, and a late
   * `$/cancelRequest` landing on a retained id — and a duplicate cancel frame
   * can reach the second one while the first is still awaiting; it must join
   * that run rather than be told `unknown` while the work is visibly in
   * progress.
   */
  it('runs the stack once when a duplicate cancellation lands mid-rollback', async () => {
    const wire = makeWire();
    const server = Peer.create(wire.serverChannel);
    const client = Peer.create(wire.clientChannel);
    const runs: string[] = [];
    let finishRollback = () => {};
    const rollbackFinished = new Promise<void>((resolve) => {
      finishRollback = resolve;
    });

    server.onRequest({
      method: 'allocateDevice',
      handler: async (_params, ctx) => {
        ctx.onUndo(async () => {
          runs.push('rollback');
          await rollbackFinished;
        });
        return { allocationId: 'alloc-1' };
      },
    });

    wire.hold();
    const ac = new AbortController();
    const watched = watch(client.request({ method: 'allocateDevice', signal: ac.signal }));
    await tick();
    const requestId = wire.seenByServer[0].id;

    ac.abort();
    await tick();
    expect(runs).toEqual(['rollback']);

    wire.sendToServer({ jsonrpc: '2.0', method: '$/cancelRequest', params: { id: requestId } });
    await tick();
    expect(runs).toEqual(['rollback']);

    finishRollback();
    await tick();
    wire.release();
    await tick();

    expect(runs).toEqual(['rollback']);
    expect(acksIn(wire.seenByClient).map((frame) => frame.params?.outcome)).toEqual([
      'undone',
      'undone',
    ]);
    expect(watched.error?.details).toEqual({ outcome: 'undone' });
  });
});

describe('a cancellation the responder has no record of', () => {
  /**
   * @issue DTX-1006
   * A `$/cancelRequest` that finds no running handler still gets an answer:
   * the requester holds an aborted call open until an acknowledgment or
   * channel close, so a miss that stayed silent would park it for the
   * connection's whole remaining life.
   */
  it('is acknowledged as `unknown` rather than met with silence', async () => {
    const wire = makeWire();
    Peer.create(wire.serverChannel);

    wire.sendToServer({ jsonrpc: '2.0', method: '$/cancelRequest', params: { id: 'never-issued' } });
    await tick();

    expect(wire.seenByClient).toEqual([
      {
        jsonrpc: '2.0',
        method: '$/cancelAck',
        params: { id: 'never-issued', outcome: 'unknown' },
      },
    ]);
  });

  it('settles the caller immediately once the retention window has closed', async () => {
    vi.useFakeTimers();
    try {
      const wire = makeWire();
      const server = Peer.create(wire.serverChannel);
      const client = Peer.create(wire.clientChannel);
      const rolledBack: string[] = [];

      server.onRequest({
        method: 'allocateDevice',
        handler: async (_params, ctx) => {
          ctx.onUndo(() => {
            rolledBack.push('device returned to the pool');
          });
          return { allocationId: 'alloc-1' };
        },
      });

      wire.hold();
      const ac = new AbortController();
      const watched = watch(client.request({ method: 'allocateDevice', signal: ac.signal }));
      await fakeTick();

      // Long past the retention window: the shared sweeper has dropped the
      // record, so there is nothing left to roll back.
      await vi.advanceTimersByTimeAsync(120_000);

      ac.abort();
      await fakeTick();
      wire.release();
      await fakeTick();

      expect(rolledBack).toEqual([]);
      expect(watched.error?.details).toEqual({ outcome: 'unknown' });
      // The point of acknowledging a miss at all: the requester keeps no
      // clock, so only this ack (or a channel close) can settle the call.
      expect(watched.settled).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('the retention map', () => {
  /**
   * @issue DTX-1011
   * One shared timer sweeps the whole retention map. A timer per record is
   * a handle per request — the same unbounded growth the map's ceiling
   * exists to prevent, just in a different allocator.
   */
  it('is swept by one shared timer, not one timer per answered request', async () => {
    vi.useFakeTimers();
    try {
      const wire = makeWire();
      const server = Peer.create(wire.serverChannel);
      const client = Peer.create(wire.clientChannel);
      server.onRequest({ method: 'noop', handler: async () => ({}) });

      for (let i = 0; i < 5; i++) {
        const call = client.request({ method: 'noop' });
        await fakeTick();
        await call;
      }

      expect(vi.getTimerCount()).toBe(1);

      wire.closeBoth();
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  /**
   * @issue DTX-1012
   * The retained-request map has a ceiling — a memory guard, since answered
   * requests have no natural bound in a long-lived server. Oldest records
   * are dropped first once it is full; a record evicted early degrades a
   * late cancellation to `unknown`, which is still an accurate answer.
   */
  it('has a ceiling: the oldest records go when it is full', async () => {
    const wire = makeWire();
    const server = Peer.create(wire.serverChannel);
    const client = Peer.create(wire.clientChannel);
    server.onRequest({ method: 'invoke', handler: async () => ({}) });

    // Spec 003 taps an app thousands of times per run; the map must not be a
    // transcript of the session.
    const total = 5000;
    for (let i = 0; i < total; i++) await client.request({ method: 'invoke' });

    const first = wire.seenByServer.find((frame) => frame.method === 'invoke')?.id;
    const last = wire.seenByServer.filter((frame) => frame.method === 'invoke').at(-1)?.id;

    wire.sendToServer({ jsonrpc: '2.0', method: '$/cancelRequest', params: { id: first } });
    wire.sendToServer({ jsonrpc: '2.0', method: '$/cancelRequest', params: { id: last } });
    await tick();

    expect(acksIn(wire.seenByClient).map((frame) => frame.params)).toEqual([
      { id: first, outcome: 'unknown' },
      { id: last, outcome: 'nothing-to-undo' },
    ]);
  });

  /**
   * @issue DTX-1007
   * A dead socket is compensated at connection level, where the server frees
   * everything the connection held — running per-request rollbacks too would
   * be a second cleanup racing the first over the same device.
   */
  it('is dropped without unwinding when the socket dies', async () => {
    const wire = makeWire();
    const server = Peer.create(wire.serverChannel);
    const client = Peer.create(wire.clientChannel);
    const rolledBack: string[] = [];

    server.onRequest({
      method: 'allocateDevice',
      handler: async (_params, ctx) => {
        ctx.onUndo(() => {
          rolledBack.push('device returned to the pool');
        });
        return { allocationId: 'alloc-1' };
      },
    });

    await client.request({ method: 'allocateDevice' });
    const requestId = wire.seenByServer[0].id;

    wire.closeBoth();
    wire.sendToServer({ jsonrpc: '2.0', method: '$/cancelRequest', params: { id: requestId } });
    await tick();

    expect(rolledBack).toEqual([]);
  });
});

describe('the mid-flight cancellation path, unchanged by retention', () => {
  /**
   * @issue DTX-1005
   * The `-32800` response doubles as the cancellation's acknowledgment: it
   * carries the rollback outcome, and no separate `$/cancelAck` follows it —
   * there is exactly one acknowledgment on this path.
   */
  it('still answers a mid-flight cancellation with -32800 and no ack', async () => {
    const wire = makeWire();
    const server = Peer.create(wire.serverChannel);
    const client = Peer.create(wire.clientChannel);
    const rolledBack: string[] = [];

    server.onRequest({
      method: 'allocateDevice',
      handler: async (_params, ctx) => {
        ctx.onUndo(() => {
          rolledBack.push('device returned to the pool');
        });
        // The R1 shape: the handler succeeds *after* the abort landed — a warm
        // device whose boot returned instantly.
        await new Promise<void>((resolve) => {
          ctx.signal.addEventListener('abort', () => resolve(), { once: true });
        });
        return { allocationId: 'alloc-1' };
      },
    });

    const reason = new Error('the suite gave up');
    const ac = new AbortController();
    const watched = watch(client.request({ method: 'allocateDevice', signal: ac.signal }));
    await tick();
    ac.abort(reason);
    await tick();

    expect(rolledBack).toEqual(['device returned to the pool']);
    expect(watched.error?.name).toBe('AbortError');
    expect(watched.error?.cause).toBe(reason);
    expect(watched.error?.details).toEqual({ outcome: 'undone' });
    expect(wire.seenByClient.at(-1)?.error?.code).toBe(-32800);
    expect(acksIn(wire.seenByClient)).toEqual([]);
  });

  /**
   * @issue DTX-1002
   * `UndoStack.run()` never rejects, even when a compensation throws and the
   * `onError` listener reporting it also throws. The rollback runs before the
   * response is composed, so anything that escaped it would take the
   * response with it — and a request answered by nothing parks a caller that
   * has no signal, and therefore no timer, forever.
   */
  it('still answers the caller when the rollback and the error listener both explode', async () => {
    const wire = makeWire();
    const server = Peer.create(wire.serverChannel);
    const client = Peer.create(wire.clientChannel);

    server.onError(() => {
      throw new Error('the error listener is user code too');
    });
    server.onRequest({
      method: 'allocateDevice',
      handler: async (_params, ctx) => {
        ctx.onUndo(() => {
          throw new Error('simctl shutdown refused');
        });
        throw new Error('the simulator never came up');
      },
    });

    await expect(client.request({ method: 'allocateDevice' })).rejects.toMatchObject({
      message: 'the simulator never came up',
    });
  });

  /**
   * @issue DTX-1008
   * On a dead socket, an aborted-and-unacknowledged call settles as
   * `unknown` and nothing softer: whether the remote side rolled anything
   * back is genuinely unknown once the socket is gone.
   */
  it('reports `unknown` when the socket dies before anything acknowledged the abort', async () => {
    const wire = makeWire();
    Peer.create(wire.serverChannel);
    const client = Peer.create(wire.clientChannel);
    const ac = new AbortController();

    wire.hold();
    const watched = watch(client.request({ method: 'allocateDevice', signal: ac.signal }));
    await tick();
    ac.abort();
    await tick();

    wire.closeBoth();
    await tick();

    expect(watched.error?.details).toEqual({ outcome: 'unknown' });
  });

  it('drops a malformed acknowledgment instead of throwing out of the dispatcher', async () => {
    const wire = makeWire();
    Peer.create(wire.serverChannel);
    const client = Peer.create(wire.clientChannel);
    const ac = new AbortController();

    wire.hold();
    const watched = watch(client.request({ method: 'allocateDevice', signal: ac.signal }));
    await tick();
    ac.abort();
    await tick();

    expect(() => wire.sendToClient({ jsonrpc: '2.0', method: '$/cancelAck' })).not.toThrow();
    await tick();
    // The call is still waiting for a real one.
    expect(watched.settled).toBe(false);
  });

  /**
   * @issue DTX-1004
   * Any unsuccessful ending unwinds the stack, not cancellation alone: a
   * handler that throws halfway has left the same debris behind as one that
   * was cancelled.
   */
  it('unwinds the stack when the handler itself fails, not only on cancellation', async () => {
    const wire = makeWire();
    const server = Peer.create(wire.serverChannel);
    const client = Peer.create(wire.clientChannel);
    const rolledBack: string[] = [];

    server.onRequest({
      method: 'allocateDevice',
      handler: async (_params, ctx) => {
        ctx.onUndo(() => {
          rolledBack.push('device returned to the pool');
        });
        throw new Error('the simulator never came up');
      },
    });

    await expect(client.request({ method: 'allocateDevice' })).rejects.toMatchObject({
      message: 'the simulator never came up',
    });
    expect(rolledBack).toEqual(['device returned to the pool']);
  });
});

/**
 * The outcome vocabulary on the *mid-flight* path (race R1). The word rides
 * the response's `data`; no second frame is invented, and `$/cancelAck`
 * stays what it always was: the answer to a cancellation that found nothing
 * running.
 */
describe('what became of the work, on the cancellation that was in time', () => {
  it('reports `undo-failed` when a compensation throws', async () => {
    const wire = makeWire();
    const server = Peer.create(wire.serverChannel);
    const client = Peer.create(wire.clientChannel);

    server.onError(() => {});
    server.onRequest({
      method: 'allocateDevice',
      handler: async (_params, ctx) => {
        ctx.onUndo(() => {
          throw new Error('simctl shutdown refused');
        });
        await new Promise<void>((resolve) => {
          ctx.signal.addEventListener('abort', () => resolve(), { once: true });
        });
        return { allocationId: 'alloc-1' };
      },
    });

    const ac = new AbortController();
    const watched = watch(client.request({ method: 'allocateDevice', signal: ac.signal }));
    await tick();
    ac.abort();
    await tick();

    // The caller is told the device is suspect rather than getting silence.
    expect(watched.error?.details).toEqual({ outcome: 'undo-failed' });
    expect(wire.seenByClient.at(-1)?.error?.code).toBe(-32800);
  });

  it('reports `nothing-to-undo` for a handler that registered no compensation', async () => {
    const wire = makeWire();
    const server = Peer.create(wire.serverChannel);
    const client = Peer.create(wire.clientChannel);

    server.onRequest({
      method: 'currentStatus',
      handler: async (_params, ctx) => {
        await new Promise<void>((resolve) => {
          ctx.signal.addEventListener('abort', () => resolve(), { once: true });
        });
        return { status: 'idle' };
      },
    });

    const ac = new AbortController();
    const watched = watch(client.request({ method: 'currentStatus', signal: ac.signal }));
    await tick();
    ac.abort();
    await tick();

    expect(watched.error?.details).toEqual({ outcome: 'nothing-to-undo' });
  });

  /**
   * A `-32800` from something that does not speak the outcome vocabulary — an
   * older server, or a peer of a different make — must still settle the caller
   * as a plain cancellation. Absence keeps meaning "nobody said", which is
   * exactly what `AbortError` documents.
   */
  it('settles a cancellation whose answer carries no outcome at all', async () => {
    const wire = makeWire();
    Peer.create(wire.serverChannel);
    const client = Peer.create(wire.clientChannel);
    const ac = new AbortController();

    wire.hold();
    const watched = watch(client.request({ method: 'allocateDevice', signal: ac.signal }));
    await tick();
    const sent = wire.seenByServer.find((frame) => frame.method === 'allocateDevice');
    ac.abort();
    await tick();

    wire.sendToClient({
      jsonrpc: '2.0',
      id: sent?.id,
      error: { code: -32800, message: 'Request cancelled' },
    });
    await tick();

    expect(watched.error?.name).toBe('AbortError');
    expect(watched.error?.details).toBeUndefined();
  });

  it('passes an outcome word it does not know straight through', async () => {
    const wire = makeWire();
    Peer.create(wire.serverChannel);
    const client = Peer.create(wire.clientChannel);
    const ac = new AbortController();

    wire.hold();
    const watched = watch(client.request({ method: 'allocateDevice', signal: ac.signal }));
    await tick();
    const sent = wire.seenByServer.find((frame) => frame.method === 'allocateDevice');
    ac.abort();
    await tick();

    wire.sendToClient({
      jsonrpc: '2.0',
      id: sent?.id,
      error: { code: -32800, message: 'Request cancelled', data: { outcome: 'mostly-fine' } },
    });
    await tick();

    // The same forward-compatibility rule `isCancelAckNotification` follows for
    // the very same field: a newer peer may know a word this one does not, and
    // swallowing it would turn "the remote side told you something" into
    // silence. Only a non-string is dropped — that is a malformed frame.
    expect(watched.error?.name).toBe('AbortError');
    expect(watched.error?.details).toEqual({ outcome: 'mostly-fine' });
  });
});
