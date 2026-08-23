import { describe, it, expect, vi, beforeEach } from 'vitest';

import { PROTOCOL_VERSION, SERVER_INFO_METHOD } from '@detox-remote/protocol';

import { init } from '../../internals';
import { DetoxErrorCode } from '../errors';
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

function lastSocket(): FakeWebSocket {
  const socket = FakeWebSocket.created.at(-1);
  if (!socket) throw new Error('expected a FakeWebSocket to have been constructed');
  return socket;
}

describe('initSession — connecting', () => {
  beforeEach(() => {
    FakeWebSocket.created.length = 0;
  });

  it('resolves the Detox handle once the socket opens, with a plain URL', async () => {
    const sessionPromise = init({ server: 'ws://fake-host/detox' });
    const socket = lastSocket();
    expect(socket.url).toBe('ws://fake-host/detox');
    socket.open();

    const session = await sessionPromise;
    expect(session).toBeDefined();
    await session.disconnect();
  });

  it('resolves with a full address, carrying headers through to the socket', async () => {
    const sessionPromise = init({
      server: { url: 'ws://fake-host/detox', headers: { Authorization: 'Bearer secret-token' } },
    });
    const socket = lastSocket();
    expect(socket.headers).toEqual({ Authorization: 'Bearer secret-token' });
    socket.open();

    await using session = await sessionPromise;
    expect(session).toBeDefined();
  });

  it('rejects with DETOX_SERVER_UNREACHABLE when the socket errors before opening', async () => {
    const sessionPromise = init({ server: 'ws://fake-host/detox' });
    const socket = lastSocket();
    socket.failToConnect(new Error('ECONNREFUSED'));

    await expect(sessionPromise).rejects.toMatchObject({
      name: 'DetoxConnectionError',
      code: DetoxErrorCode.DETOX_SERVER_UNREACHABLE,
    });
  });

  it('rejects with DETOX_UNAUTHORIZED, noting the token was rejected, on a 401 with a sent token', async () => {
    const sessionPromise = init({
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
    const sessionPromise = init({ server: 'ws://fake-host/detox' });
    lastSocket().refuseHandshake(401);

    const error = await rejectionOf(sessionPromise);
    expect(error.message).toMatch(/no Authorization token was sent/);
  });

  it('treats a blank Authorization header as "no token sent"', async () => {
    // `.trim().length > 'Bearer'.length` — a header present but empty (or
    // just the scheme) must not be misreported as a rejected real token.
    const sessionPromise = init({
      server: { url: 'ws://fake-host/detox', headers: { Authorization: 'Bearer' } },
    });
    lastSocket().refuseHandshake(401);

    const error = await rejectionOf(sessionPromise);
    expect(error.message).toMatch(/no Authorization token was sent/);
  });

  it('rejects with DETOX_SERVER_UNREACHABLE, HTTP status in the message, on a non-401 refusal', async () => {
    const sessionPromise = init({ server: 'ws://fake-host/detox' });
    lastSocket().refuseHandshake(503);

    const error = await rejectionOf(sessionPromise);
    expect(error.code).toBe(DetoxErrorCode.DETOX_SERVER_UNREACHABLE);
    expect(error.message).toMatch(/HTTP 503/);
  });

  it('rejects immediately with AbortError when the signal is already aborted', async () => {
    const controller = new AbortController();
    const reason = new Error('gave up before dialing');
    controller.abort(reason);

    await expect(init({ server: 'ws://fake-host/detox', signal: controller.signal })).rejects.toMatchObject({
      name: 'AbortError',
      cause: reason,
    });
    // Aborted before `connectWebSocket` could run — no socket was even opened.
    expect(FakeWebSocket.created).toHaveLength(0);
  });

  it('aborts and terminates the socket when the signal fires mid-connect', async () => {
    const controller = new AbortController();
    const reason = new Error('caller gave up');
    const sessionPromise = init({ server: 'ws://fake-host/detox', signal: controller.signal });
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
    const sessionPromise = init({ server: 'ws://fake-host/detox' });
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
    const sessionPromise = init({ server: 'ws://fake-host/detox' });
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
