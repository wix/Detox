import { describe, it, expect } from 'vitest';
import { memoryChannel, Peer, DetoxErrorCode, DetoxError } from '..';
import type { ObservedProgress, ObservedRequestBegin, ObservedRequestEnd } from '..';

/**
 * Spec 012's two named core changes: `Peer.observe` (the logging seam over
 * handled requests) and the typed reason a running handler is aborted with
 * when the channel closes underneath it.
 */
describe('Peer.observe — the logging seam (spec 012)', () => {
  function wire() {
    const [clientCh, serverCh] = memoryChannel();
    const client = Peer.create(clientCh);
    const server = Peer.create(serverCh);
    const begins: ObservedRequestBegin[] = [];
    const progress: ObservedProgress[] = [];
    const ends: ObservedRequestEnd[] = [];
    server.observe({
      onRequestBegin: (info) => begins.push(info),
      onProgress: (info) => progress.push(info),
      onRequestEnd: (info) => ends.push(info),
    });
    return { client, server, clientCh, begins, progress, ends };
  }

  it('sees begin, every progress value, and a successful end with a duration', async () => {
    const { client, server, begins, progress, ends } = wire();
    server.onRequest({
      method: 'echo',
      handler: async (params, ctx) => {
        ctx.progress({ step: 1 });
        return params;
      },
    });

    await expect(client.request({ method: 'echo', params: { a: 1 } })).resolves.toEqual({ a: 1 });

    expect(begins).toHaveLength(1);
    expect(begins[0]).toMatchObject({ id: '1', method: 'echo', params: { a: 1 } });
    expect(begins[0].signal).toBeInstanceOf(AbortSignal);
    expect(progress).toEqual([{ id: '1', value: { step: 1 } }]);
    expect(ends).toHaveLength(1);
    expect(ends[0]).toMatchObject({ id: '1', method: 'echo', ok: true });
    expect(typeof ends[0].durationMs).toBe('number');
    expect(ends[0].error).toBeUndefined();
    // Spec 012: a successful end carries the result as sent.
    expect(ends[0].result).toEqual({ a: 1 });
  });

  it('a failed end carries the wire error object verbatim (a typed refusal keeps its code)', async () => {
    const { client, server, ends } = wire();
    server.onRequest({
      method: 'refuse',
      handler: () =>
        Promise.reject(new DetoxError('nope', { code: DetoxErrorCode.DETOX_NO_MATCHING_DEVICE, details: { x: 1 } })),
    });

    await expect(client.request({ method: 'refuse' })).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_NO_MATCHING_DEVICE,
    });
    expect(ends[0].result).toBeUndefined();
    expect(ends[0]).toMatchObject({
      ok: false,
      error: { code: DetoxErrorCode.DETOX_NO_MATCHING_DEVICE, message: 'nope', data: { x: 1 } },
    });
  });

  it('a cancelled request ends with the -32800 answer as its error', async () => {
    const { client, server, ends } = wire();
    server.onRequest({
      method: 'hang',
      handler: (_params, ctx) =>
        new Promise((_, reject) => ctx.signal.addEventListener('abort', () => reject(new Error('aborted')))),
    });
    const ac = new AbortController();
    const call = client.request({ method: 'hang', signal: ac.signal });
    await new Promise((r) => setTimeout(r, 5));
    ac.abort();
    await expect(call).rejects.toMatchObject({ name: 'AbortError' });
    expect(ends[0]).toMatchObject({ ok: false, error: { code: -32800, data: { outcome: 'nothing-to-undo' } } });
  });

  it('progress is observed before the wire mute that follows an abort', async () => {
    const { client, server, clientCh, progress, ends } = wire();
    server.onRequest({
      method: 'narrate-late',
      handler: async (_params, ctx) => {
        await new Promise<void>((resolve) => ctx.signal.addEventListener('abort', () => resolve()));
        ctx.progress('after the abort');
        throw new Error('gone');
      },
    });
    const call = client.request({ method: 'narrate-late' });
    await new Promise((r) => setTimeout(r, 5));
    clientCh.close();
    await expect(call).rejects.toThrow('Channel closed');
    await new Promise((r) => setTimeout(r, 5));
    expect(progress).toEqual([{ id: '1', value: 'after the abort' }]);
    expect(ends).toHaveLength(1);
  });

  it('an observer that throws is reported through onError and never disturbs the request', async () => {
    const { client, server } = wire();
    const reported: Error[] = [];
    server.onError((err) => reported.push(err));
    server.observe({
      onRequestBegin: () => {
        throw new Error('observer bug');
      },
    });
    server.onRequest({ method: 'ok', handler: () => Promise.resolve(42) });
    await expect(client.request({ method: 'ok' })).resolves.toBe(42);
    expect(reported.map((e) => e.message)).toEqual(['observer bug']);
  });
});

describe('the close-abort reason — DETOX_CONNECTION_LOST (spec 012)', () => {
  it('aborts a running handler with a DetoxConnectionError, not an empty reason', async () => {
    const [clientCh, serverCh] = memoryChannel();
    const client = Peer.create(clientCh);
    const server = Peer.create(serverCh);
    let reason: unknown;
    server.onRequest({
      method: 'hang',
      handler: (_params, ctx) =>
        new Promise((_, reject) =>
          ctx.signal.addEventListener('abort', () => {
            reason = ctx.signal.reason;
            reject(new Error('aborted'));
          }),
        ),
    });
    const call = client.request({ method: 'hang' });
    await new Promise((r) => setTimeout(r, 5));
    clientCh.close();
    await expect(call).rejects.toThrow('Channel closed');

    expect(reason).toMatchObject({
      name: 'DetoxConnectionError',
      code: DetoxErrorCode.DETOX_CONNECTION_LOST,
      message: 'connection closed while the request was running',
    });
  });
});

describe('the step member and the handler scope (spec 013)', () => {
  it('a request made with `step` carries it on the frame, and the observer sees it unjudged', async () => {
    const [clientCh, serverCh] = memoryChannel();
    const client = Peer.create(clientCh);
    const server = Peer.create(serverCh);
    const begins: ObservedRequestBegin[] = [];
    const frames: unknown[] = [];
    serverCh.onMessage((msg) => frames.push(msg));
    server.observe({ onRequestBegin: (info) => begins.push(info) });
    server.onRequest({ method: 'ok', handler: () => Promise.resolve(1) });

    await client.request({ method: 'ok', step: 'abc' });
    await client.request({ method: 'ok' });

    expect(frames[0]).toMatchObject({ jsonrpc: '2.0', id: '1', method: 'ok', step: 'abc' });
    expect(frames[1]).not.toHaveProperty('step');
    expect(begins[0].step).toBe('abc');
    expect('step' in begins[1]).toBe(false);
  });

  it('createMethod forwards `step` from CallOptions', async () => {
    const [clientCh, serverCh] = memoryChannel();
    const client = Peer.create(clientCh);
    const server = Peer.create(serverCh);
    const begins: ObservedRequestBegin[] = [];
    server.observe({ onRequestBegin: (info) => begins.push(info) });
    server.onRequest({ method: 'ok', handler: () => Promise.resolve(1) });
    const ok = client.createMethod<undefined, number>('ok');
    await ok(undefined, { step: 'from-opts' });
    expect(begins[0].step).toBe('from-opts');
  });

  it('runs every handler inside the embedder\'s scope, with the observed begin in hand', async () => {
    const { AsyncLocalStorage } = await import('node:async_hooks');
    const scope = new AsyncLocalStorage<string>();
    const [clientCh, serverCh] = memoryChannel();
    const client = Peer.create(clientCh);
    const server = Peer.create(serverCh, {
      handlerScope: (info, run) => scope.run(`request ${info.id} (${info.method})`, run),
    });
    server.onRequest({
      method: 'whoami',
      handler: async () => {
        await new Promise((r) => setTimeout(r, 1));
        return scope.getStore();
      },
    });
    await expect(client.request({ method: 'whoami' })).resolves.toBe('request 1 (whoami)');
    await expect(client.request({ method: 'whoami' })).resolves.toBe('request 2 (whoami)');
  });

  it('a scope that rejects fails the request like a handler that threw', async () => {
    const [clientCh, serverCh] = memoryChannel();
    const client = Peer.create(clientCh);
    const server = Peer.create(serverCh, { handlerScope: () => Promise.reject(new Error('scope broke')) });
    server.onRequest({ method: 'ok', handler: () => Promise.resolve(1) });
    await expect(client.request({ method: 'ok' })).rejects.toThrow('scope broke');
  });
});

describe('the handler scope holds for the rollback too (spec 013)', () => {
  it('a rollback on failure, on cancellation, and a late cancel\'s rollback all run inside the request\'s scope', async () => {
    const { AsyncLocalStorage } = await import('node:async_hooks');
    const scope = new AsyncLocalStorage<string>();
    const [clientCh, serverCh] = memoryChannel();
    const client = Peer.create(clientCh);
    const server = Peer.create(serverCh, { handlerScope: (info, run) => scope.run(`rpc:${info.id}`, run) });
    const undone: Array<string | undefined> = [];
    server.onRequest({
      method: 'fail',
      handler: (_params, ctx) => {
        ctx.onUndo(() => {
          undone.push(scope.getStore());
        });
        return Promise.reject(new Error('no'));
      },
    });
    server.onRequest({
      method: 'hang',
      handler: (_params, ctx) => {
        ctx.onUndo(() => {
          undone.push(scope.getStore());
        });
        return new Promise((_, reject) => ctx.signal.addEventListener('abort', () => reject(new Error('aborted'))));
      },
    });
    server.onRequest({
      method: 'answered',
      handler: (_params, ctx) => {
        ctx.onUndo(() => {
          undone.push(scope.getStore());
        });
        return Promise.resolve(1);
      },
    });
    await expect(client.request({ method: 'fail' })).rejects.toThrow();
    const ac = new AbortController();
    const hang = client.request({ method: 'hang', signal: ac.signal });
    await new Promise((r) => setTimeout(r, 5));
    ac.abort();
    await expect(hang).rejects.toMatchObject({ name: 'AbortError' });
    await client.request({ method: 'answered' });
    client.notify({ method: '$/cancelRequest', params: { id: '3' } });
    await new Promise((r) => setTimeout(r, 10));
    expect(undone).toEqual(['rpc:1', 'rpc:2', 'rpc:3']);
  });
});
