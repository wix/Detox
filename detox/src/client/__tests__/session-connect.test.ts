import { describe, it, expect, vi, beforeEach } from 'vitest';

import { PROTOCOL_VERSION, SERVER_INFO_METHOD } from '@detox-remote/protocol';

import { connect } from '../../client';
import { AbortError, DetoxErrorCode } from '../errors';
import { FakeWebSocket, createFakeServer } from './helpers/fake-transport';

// `session.ts` imports the real `ws` package's default export and calls
// `new WebSocket(url, opts)` exactly once per `connectWebSocket`. Swapping it
// for `FakeWebSocket` is what lets every branch of that handshake run without
// a real socket or port. `vi.mock` is hoisted above every import in this
// file, so the factory does its own dynamic import instead of closing over
// the static one above (a mock factory may not reference top-level bindings
// from this module — `FakeWebSocket` is a live ES module export either way,
// so both resolve to the very same class).
vi.mock('ws', async () => {
  const { FakeWebSocket: FakeWebSocketCtor } = await import('./helpers/fake-transport');
  return { default: FakeWebSocketCtor };
});

/** Awaits a promise expected to reject, and returns the rejection typed as an Error. */
async function rejectionOf(promise: Promise<unknown>): Promise<Error & Record<string, unknown>> {
  try {
    await promise;
  } catch (error) {
    return error as Error & Record<string, unknown>;
  }
  throw new Error('expected the promise to reject, but it resolved');
}

/**
 * The internal announce-ceiling override (`InternalInitOptions` in
 * session.ts) — not on the public options type, so it is spread in through
 * this one typed seam rather than a cast at every call site.
 */
interface AnnounceTimeoutOverride {
  announceTimeoutMs: number;
}

function withAnnounceTimeout(announceTimeoutMs: number): AnnounceTimeoutOverride {
  return { announceTimeoutMs };
}

function lastSocket(): FakeWebSocket {
  const socket = FakeWebSocket.created.at(-1);
  if (!socket) throw new Error('expected a FakeWebSocket to have been constructed');
  return socket;
}

describe('connectSession — connecting', () => {
  beforeEach(() => {
    FakeWebSocket.created.length = 0;
  });

  it('resolves the Detox handle once the socket opens, with a plain URL', async () => {
    const sessionPromise = connect({ server: 'ws://fake-host/detox' });
    const socket = lastSocket();
    expect(socket.url).toBe('ws://fake-host/detox');
    socket.open();

    const session = await sessionPromise;
    expect(session).toBeDefined();
    await session.disconnect();
  });

  it('resolves with a full address, carrying headers through to the socket', async () => {
    const sessionPromise = connect({
      server: { url: 'ws://fake-host/detox', headers: { Authorization: 'Bearer secret-token' } },
    });
    const socket = lastSocket();
    expect(socket.headers).toEqual({ Authorization: 'Bearer secret-token' });
    socket.open();

    await using session = await sessionPromise;
    expect(session).toBeDefined();
  });

  it('rejects with DETOX_SERVER_UNREACHABLE when the socket errors before opening', async () => {
    const sessionPromise = connect({ server: 'ws://fake-host/detox' });
    const socket = lastSocket();
    socket.failToConnect(new Error('ECONNREFUSED'));

    await expect(sessionPromise).rejects.toMatchObject({
      name: 'DetoxConnectionError',
      code: DetoxErrorCode.DETOX_SERVER_UNREACHABLE,
    });
  });

  it('rejects with DETOX_UNAUTHORIZED, noting the token was rejected, on a 401 with a sent token', async () => {
    const sessionPromise = connect({
      server: { url: 'ws://fake-host/detox', headers: { Authorization: 'Bearer a-real-token' } },
    });
    const socket = lastSocket();
    socket.refuseHandshake(401);

    const error = await rejectionOf(sessionPromise);
    expect(error.name).toBe('DetoxConnectionError');
    expect(error.code).toBe(DetoxErrorCode.DETOX_UNAUTHORIZED);
    expect(error.message).toMatch(/token was rejected/);
    // The refused handshake is terminated, not left to linger.
    expect(socket.readyState).toBe(3);
  });

  it('rejects with DETOX_UNAUTHORIZED, noting no token was sent, on a 401 with none', async () => {
    const sessionPromise = connect({ server: 'ws://fake-host/detox' });
    lastSocket().refuseHandshake(401);

    const error = await rejectionOf(sessionPromise);
    expect(error.message).toMatch(/no Authorization token was sent/);
  });

  it('treats a blank Authorization header as "no token sent"', async () => {
    // `.trim().length > 'Bearer'.length` — a header present but empty (or
    // just the scheme) must not be misreported as a rejected real token.
    const sessionPromise = connect({
      server: { url: 'ws://fake-host/detox', headers: { Authorization: 'Bearer' } },
    });
    lastSocket().refuseHandshake(401);

    const error = await rejectionOf(sessionPromise);
    expect(error.message).toMatch(/no Authorization token was sent/);
  });

  it('rejects with DETOX_SERVER_UNREACHABLE, HTTP status in the message, on a non-401 refusal', async () => {
    const sessionPromise = connect({ server: 'ws://fake-host/detox' });
    lastSocket().refuseHandshake(503);

    const error = await rejectionOf(sessionPromise);
    expect(error.code).toBe(DetoxErrorCode.DETOX_SERVER_UNREACHABLE);
    expect(error.message).toMatch(/HTTP 503/);
  });

  it('rejects immediately with AbortError when the signal is already aborted', async () => {
    const controller = new AbortController();
    const reason = new Error('gave up before dialing');
    controller.abort(reason);

    await expect(connect({ server: 'ws://fake-host/detox', signal: controller.signal })).rejects.toMatchObject({
      name: 'AbortError',
      cause: reason,
    });
    // Aborted before `connectWebSocket` could run — no socket was even opened.
    expect(FakeWebSocket.created).toHaveLength(0);
  });

  it('aborts and terminates the socket when the signal fires mid-connect', async () => {
    const controller = new AbortController();
    const reason = new Error('caller gave up');
    const sessionPromise = connect({ server: 'ws://fake-host/detox', signal: controller.signal });
    const socket = lastSocket();

    controller.abort(reason);

    await expect(sessionPromise).rejects.toMatchObject({ name: 'AbortError', cause: reason });
    expect(socket.readyState).toBe(3);

    // A late 'open' from a socket already torn down must not resurrect it —
    // nothing here should throw, and the settled rejection must not change.
    expect(() => socket.open()).not.toThrow();

    // `terminate()` (called above, on abort) can surface an async "closed
    // before the connection was established" 'error' on a real `ws` socket.
    // `cleanup()` swaps in a no-op sink for exactly this case (session.ts) —
    // without it, Node's EventEmitter throws synchronously on an 'error'
    // event with no listener, turning a clean cancellation into a crash.
    expect(() => socket.emit('error', new Error('closed before established'))).not.toThrow();
  });
});

describe('the version announce — $/serverInfo', () => {
  beforeEach(() => {
    FakeWebSocket.created.length = 0;
  });

  it('a matching protocol changes nothing — the session keeps working', async () => {
    const sessionPromise = connect({ server: 'ws://fake-host/detox' });
    const socket = lastSocket();
    socket.open();
    const session = await sessionPromise;
    const server = createFakeServer(socket);

    server.notify(SERVER_INFO_METHOD, { protocol: PROTOCOL_VERSION, server: '21.0.0-alpha.0' });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(socket.readyState).toBe(1); // still OPEN — no refusal fired
    await session.disconnect();
  });

  /**
   * @issue DTX-2006
   * The close code a client sends when it refuses a mismatched protocol
   * maps to `DETOX_VERSION_SKEW`, so every pending call settles typed
   * instead of as a generic connection loss.
   */
  it('a mismatched protocol closes the session typed — DETOX_VERSION_SKEW naming both sides', async () => {
    const sessionPromise = connect({ server: 'ws://fake-host/detox' });
    const socket = lastSocket();
    socket.open();
    const session = await sessionPromise;
    const server = createFakeServer(socket);

    server.notify(SERVER_INFO_METHOD, { protocol: 999, server: '22.0.0' });
    await new Promise((resolve) => setTimeout(resolve, 0));

    const err = await rejectionOf(
      session.allocateDevice({ type: 'ios.simulator' }),
    );
    expect(err.code).toBe(DetoxErrorCode.DETOX_VERSION_SKEW);
    expect(err.message).toContain('999');
    expect(err.message).toContain(String(PROTOCOL_VERSION));
    expect(err.message).toContain('detox server');
  });
});

describe('the connection log handle — runId & log.begin (spec 012)', () => {
  beforeEach(() => {
    FakeWebSocket.created.length = 0;
  });

  it('exposes the announced runId and forwards steps on the wire, kind and attrs unvalidated', async () => {
    const sessionPromise = connect({ server: 'ws://fake-host/detox' });
    const socket = lastSocket();
    const steps: unknown[] = [];
    const server = createFakeServer(socket);
    server.peer.onNotify({ method: '$/log', handler: (params) => steps.push(params) });
    socket.open({ runId: 'conn-xyz' });
    const session = await sessionPromise;

    expect(session.runId).toBe('conn-xyz');
    const step = session.log.begin({ kind: 'test', name: 'login', attrs: { n: 1, tags: ['a'] } });
    expect(typeof step.id).toBe('string');
    expect(step.ended).toBe(false);
    step.end({ status: 'failed', error: new Error('nope') });
    expect(step.ended).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(steps[0]).toMatchObject({ id: step.id, phase: 'begin', kind: 'test', name: 'login', attrs: { n: 1, tags: ['a'] } });
    expect(steps[1]).toMatchObject({ id: step.id, phase: 'end', status: 'failed', error: { name: 'Error', message: 'nope' } });
    await session.disconnect();
  });

  it('an end without an error omits the field', async () => {
    const sessionPromise = connect({ server: 'ws://fake-host/detox' });
    const socket = lastSocket();
    const steps: Record<string, unknown>[] = [];
    const server = createFakeServer(socket);
    server.peer.onNotify({ method: '$/log', handler: (params) => steps.push(params as Record<string, unknown>) });
    socket.open({ runId: 'conn-1' });
    const session = await sessionPromise;
    session.log.begin({ kind: 'step', name: 'plain' }).end({ status: 'passed' });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(steps[1]).not.toHaveProperty('error');
    await session.disconnect();
  });

  it('detox.log writes lines at a level, with or without fields; detox.step wraps a callback and ends by outcome', async () => {
    const sessionPromise = connect({ server: 'ws://fake-host/detox' });
    const socket = lastSocket();
    const frames: Record<string, unknown>[] = [];
    const server = createFakeServer(socket);
    server.peer.onNotify({ method: '$/log', handler: (params) => frames.push(params as Record<string, unknown>) });
    socket.open({ runId: 'run-1' });
    const session = await sessionPromise;

    session.log('plain');
    session.log.warn({ attempt: 2 }, 'slow');
    session.log.error('boom');
    session.log.debug({ a: 1 }, 'dbg');
    session.log.info('inf');
    const manual = session.step('manual');
    manual.end({ status: 'skipped' });
    const result = await session.step('passes', async () => 'value');
    expect(result).toBe('value');
    await expect(session.step('fails', () => Promise.reject(new TypeError('bad')))).rejects.toThrow('bad');
    await expect(session.step('aborts', () => { throw new AbortError('stop'); })).rejects.toBeInstanceOf(AbortError);
    // eslint-disable-next-line @typescript-eslint/only-throw-error -- the non-Error branch of `step` is the point
    await expect(session.step('throws a string', () => { throw 'oops'; })).rejects.toBe('oops');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(frames.slice(0, 5)).toEqual([
      { phase: 'log', level: 'info', msg: 'plain' },
      { phase: 'log', level: 'warn', msg: 'slow', fields: { attempt: 2 } },
      { phase: 'log', level: 'error', msg: 'boom' },
      { phase: 'log', level: 'debug', msg: 'dbg', fields: { a: 1 } },
      { phase: 'log', level: 'info', msg: 'inf' },
    ]);
    expect(frames[5]).toMatchObject({ phase: 'begin', kind: 'step', name: 'manual', id: manual.id });
    expect(frames[6]).toMatchObject({ phase: 'end', id: manual.id, status: 'skipped' });
    expect(frames[7]).toMatchObject({ phase: 'begin', kind: 'step', name: 'passes' });
    expect(frames[8]).toMatchObject({ phase: 'end', status: 'passed' });
    expect(frames[10]).toMatchObject({ phase: 'end', status: 'failed', error: { name: 'TypeError', message: 'bad' } });
    expect(frames[12]).toMatchObject({ phase: 'end', status: 'aborted', error: { name: 'AbortError' } });
    expect(frames[14]).toMatchObject({ phase: 'end', status: 'failed', error: { name: 'Error', message: 'oops' } });
    await session.disconnect();
  });

  it('an endpoint that announces no log leaves runId undefined and log.begin a typed refusal', async () => {
    const sessionPromise = connect({ server: 'ws://fake-host/detox' });
    const socket = lastSocket();
    socket.open({ runId: null });
    const session = await sessionPromise;

    expect(session.runId).toBeUndefined();
    let error: (Error & { code?: number }) | undefined;
    try {
      session.log.begin({ kind: 'test', name: 'x' });
    } catch (err) {
      error = err as Error & { code?: number };
    }
    expect(error?.code).toBe(DetoxErrorCode.DETOX_NOT_IMPLEMENTED);
    expect(error?.message).toContain('does not record a log');
    await session.disconnect();
  });

  it('init rejects typed if the socket closes before the announce arrives', async () => {
    const sessionPromise = connect({ server: 'ws://fake-host/detox' });
    const socket = lastSocket();
    socket.open({ announce: false });
    // Let init construct the session (and register its close listener)
    // before the socket dies — otherwise the close races the listener.
    await new Promise((resolve) => setTimeout(resolve, 0));
    socket.close(4000, 'gone early');
    const err = await rejectionOf(sessionPromise);
    expect(err.code).toBe(DetoxErrorCode.DETOX_CONNECTION_LOST);
    expect(err.message).toContain('before announcing');
  });

  it('aborting the init signal while the announce is still pending rejects the session', async () => {
    const controller = new AbortController();
    const sessionPromise = connect({ server: 'ws://fake-host/detox', signal: controller.signal });
    const socket = lastSocket();
    socket.open({ announce: false });
    await new Promise((resolve) => setTimeout(resolve, 0));
    controller.abort();
    const err = await rejectionOf(sessionPromise);
    expect(err.name).toBe('AbortError');
  });

  /**
   * The ceiling on the announce (`ANNOUNCE_TIMEOUT_MS`): an endpoint that
   * opens the socket and never speaks must fail `connect` typed, not park it
   * until the process dies. The production bound is 30s, and the timer behind
   * `AbortSignal.timeout` is beyond fake timers, so the internal override
   * lowers it and the elapsed-time check proves the clock — nothing else —
   * ended the wait.
   */
  it('a socket that opens and never announces rejects typed once the announce ceiling expires', async () => {
    const startedAt = Date.now();
    const sessionPromise = connect({ server: 'ws://fake-host/detox', ...withAnnounceTimeout(50) });
    const socket = lastSocket();
    socket.open({ announce: false });

    const err = await rejectionOf(sessionPromise);
    expect(Date.now() - startedAt).toBeLessThan(2_000);
    expect(err.name).toBe('DetoxConnectionError');
    expect(err.code).toBe(DetoxErrorCode.DETOX_SERVER_DID_NOT_ANNOUNCE);
    expect(err.message).toContain('did not announce itself within 50ms');
    expect(err.message).toContain('ws://fake-host/detox');
    expect(err.details).toEqual({ url: 'ws://fake-host/detox', timeoutMs: 50 });
    // The socket does not outlive the `connect` that gave up on it.
    expect(socket.readyState).toBe(3);
  });

  it("the caller's abort keeps its AbortError when it lands ahead of the announce ceiling", async () => {
    const controller = new AbortController();
    const reason = new Error('caller gave up first');
    const startedAt = Date.now();
    const sessionPromise = connect({
      server: 'ws://fake-host/detox',
      signal: controller.signal,
      ...withAnnounceTimeout(5_000),
    });
    lastSocket().open({ announce: false });
    await new Promise((resolve) => setTimeout(resolve, 0));
    controller.abort(reason);

    const err = await rejectionOf(sessionPromise);
    expect(Date.now() - startedAt).toBeLessThan(2_000);
    expect(err.name).toBe('AbortError');
    expect(err.cause).toBe(reason);
  });

  it('an announce that arrives inside the ceiling leaves connect untouched', async () => {
    const sessionPromise = connect({ server: 'ws://fake-host/detox', ...withAnnounceTimeout(1_000) });
    lastSocket().open({ runId: 'conn-in-time' });

    const session = await sessionPromise;
    expect(session.runId).toBe('conn-in-time');
    await session.disconnect();
  });
});

describe('the step context — explicit parenting (spec 013)', () => {
  beforeEach(() => {
    FakeWebSocket.created.length = 0;
  });

  it('a request made inside handle.run carries the step; outside, none; an explicit parent beats the ambient one', async () => {
    const sessionPromise = connect({ server: 'ws://fake-host/detox' });
    const socket = lastSocket();
    const frames: Record<string, unknown>[] = [];
    const steps: Array<{ step?: unknown; method: string }> = [];
    const server = createFakeServer(socket);
    server.peer.onNotify({ method: '$/log', handler: (params) => frames.push(params as Record<string, unknown>) });
    server.peer.observe({ onRequestBegin: (info) => steps.push({ step: info.step, method: info.method }) });
    server.onRequest('allocateDevice', () => Promise.reject(new Error('refused')));
    socket.open({ runId: 'run-1' });
    const session = await sessionPromise;

    const outer = session.log.begin({ kind: 'test', name: 'outer' });
    await outer.run(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1));
      session.log('a line from inside');
      // Nested: the ambient parent is `outer`.
      const inner = session.log.begin({ kind: 'step', name: 'inner' });
      inner.end({ status: 'passed' });
      // Explicit: the caller's word wins over the ambient context.
      session.log.begin({ kind: 'hook', name: 'explicit', parent: 'elsewhere' }).end({ status: 'passed' });
      await session.allocateDevice({ type: 'ios.simulator' }).catch(() => undefined);
    });
    await session.allocateDevice({ type: 'ios.simulator' }).catch(() => undefined);
    outer.end({ status: 'passed' });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(frames[0]).toMatchObject({ phase: 'begin', name: 'outer' });
    expect(frames[0]).not.toHaveProperty('parent');
    expect(frames[1]).toMatchObject({ phase: 'log', msg: 'a line from inside', step: outer.id });
    expect(frames[2]).toMatchObject({ phase: 'begin', name: 'inner', parent: outer.id });
    expect(frames[4]).toMatchObject({ phase: 'begin', name: 'explicit', parent: 'elsewhere' });
    expect(steps).toEqual([
      { method: 'allocateDevice', step: outer.id },
      { method: 'allocateDevice', step: undefined },
    ]);
    await session.disconnect();
  });

  it('detox.step(name, fn) runs the body inside its own step, and two overlapping bodies each keep theirs', async () => {
    const sessionPromise = connect({ server: 'ws://fake-host/detox' });
    const socket = lastSocket();
    const frames: Record<string, unknown>[] = [];
    const seen: Array<{ step?: unknown; params: unknown }> = [];
    const server = createFakeServer(socket);
    server.peer.onNotify({ method: '$/log', handler: (params) => frames.push(params as Record<string, unknown>) });
    server.peer.observe({ onRequestBegin: (info) => seen.push({ step: info.step, params: info.params }) });
    server.onRequest('bootDevice', () => Promise.reject(new Error('no such device')));
    socket.open({ runId: 'run-2' });
    const session = await sessionPromise;
    const first = session.step('first', async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      await session.step('first-nested', () => Promise.resolve());
    });
    const second = session.step('second', async () => {
      await new Promise((resolve) => setTimeout(resolve, 1));
    });
    await Promise.all([first, second]);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const begins = frames.filter((f) => f.phase === 'begin');
    const firstBegin = begins.find((f) => f.name === 'first');
    const secondBegin = begins.find((f) => f.name === 'second');
    const nested = begins.find((f) => f.name === 'first-nested');
    expect(firstBegin).not.toHaveProperty('parent');
    expect(secondBegin).not.toHaveProperty('parent');
    // Begun after `second` had started (and ended) — still `first`'s child, never "the most recently begun".
    expect(nested?.parent).toBe(firstBegin?.id);
    await session.disconnect();
  });
});
