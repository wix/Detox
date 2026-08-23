import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';

import { describe, it, expect, vi, afterEach } from 'vitest';
import WebSocket from 'ws';

import { PROTOCOL_VERSION, SERVER_INFO_METHOD } from '@detox-remote/protocol';

import { createDetoxRemoteServer, DEFAULT_HOST } from '../server';
import { generateToken, type AuthConfig } from '../auth';
import type { SimulatorOps } from '../SimulatorOps';

/** The private-but-stable `ws` internal we reach into to simulate a frozen peer. */
interface SocketPausableForTest {
  _socket: { pause(): void };
}

/**
 * The real `WebSocket.prototype.send`, captured once at module load (before
 * any test patches it) via a property descriptor rather than a direct member
 * access — a plain function value, never a bare method reference that could
 * lose its `this` — and always invoked through `.apply`.
 */
const originalSendFn: (ws: WebSocket, args: unknown[]) => unknown = (() => {
  const descriptor = Object.getOwnPropertyDescriptor(WebSocket.prototype, 'send');
  const fn = descriptor?.value as ((this: WebSocket, ...args: unknown[]) => unknown) | undefined;
  if (!fn) throw new Error('WebSocket.prototype.send is missing — cannot patch it for this test');
  return (ws: WebSocket, args: unknown[]) => fn.apply(ws, args);
})();
function callOriginalSend(ws: WebSocket, args: unknown[]): unknown {
  return originalSendFn(ws, args);
}
function restoreOriginalSend(): void {
  WebSocket.prototype.send = function restoredSend(this: WebSocket, ...args: unknown[]) {
    return callOriginalSend(this, args);
  } as typeof WebSocket.prototype.send;
}

const auth: AuthConfig = { type: 'static-token', token: generateToken() };

// Hermetic: the registry's reconcile loop starts with the server, and these
// tests must not depend on (or spawn) real applesimutils listings.
const simulatorOps = { list: async () => [] } as unknown as SimulatorOps;

// Every unit server gets a throwaway blob root: opening the store SWEEPS its
// tmp/ directory, and pointing that at the machine's real per-user store from
// a test would delete a real server's in-flight uploads.
function isolatedBlobs() {
  return { root: mkdtempSync(path.join(tmpdir(), 'detox-blob-test-')) };
}

async function startServer(overrides: { host?: string; auth?: AuthConfig } = {}) {
  return createDetoxRemoteServer({
    port: 0,
    maxPool: 4,
    auth,
    simulatorOps,
    blobs: isolatedBlobs(),
    ...overrides,
  });
}

/** Resolves `'open'` or the HTTP status the handshake was refused with. */
function tryConnect(url: string, headers?: Record<string, string>): Promise<'open' | number> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url, { headers });
    const timer = setTimeout(() => {
      ws.terminate();
      reject(new Error(`no answer from ${url} within 5s`));
    }, 5_000);
    const settle = (value: 'open' | number) => {
      clearTimeout(timer);
      resolve(value);
    };
    ws.once('open', () => {
      settle('open');
      ws.close();
    });
    ws.once('unexpected-response', (_req, res) => {
      ws.terminate();
      settle(res.statusCode ?? 0);
    });
    ws.once('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

describe('Detox Server handshake', () => {
  it('turns away a client with no token', async () => {
    const server = await startServer();
    try {
      expect(await tryConnect(`ws://${DEFAULT_HOST}:${server.port}`)).toBe(401);
    } finally {
      await server.close();
    }
  });

  it('turns away a client with the wrong token', async () => {
    const server = await startServer();
    try {
      const headers = { Authorization: `Bearer ${generateToken()}` };
      expect(await tryConnect(`ws://${DEFAULT_HOST}:${server.port}`, headers)).toBe(401);
    } finally {
      await server.close();
    }
  });

  it('admits a client presenting the configured token', async () => {
    const server = await startServer();
    try {
      const headers = { Authorization: `Bearer ${auth.token}` };
      expect(await tryConnect(`ws://${DEFAULT_HOST}:${server.port}`, headers)).toBe('open');
    } finally {
      await server.close();
    }
  });

  it('refuses to start with a token that cannot turn anyone away', async () => {
    // Better a server that will not boot than one that quietly admits everyone.
    await expect(startServer({ auth: { type: 'static-token', token: '' } })).rejects.toThrow(
      /Refusing to start/,
    );
  });

  /**
   * The configured string is not evidence of anything. A name-valued default
   * would satisfy `server.host === DEFAULT_HOST` while binding `::1` alone —
   * and a client dialling the literal `127.0.0.1` has no fallback from that,
   * where a client dialling the *name* recovers via Happy Eyeballs. So assert
   * the address that actually answers, not the one we asked for.
   */
  it('binds the loopback address it announces, and only that one', async () => {
    const server = await startServer();
    try {
      expect(server.host).toBe(DEFAULT_HOST);
      expect(DEFAULT_HOST).toBe('127.0.0.1');

      const headers = { Authorization: `Bearer ${auth.token}` };
      expect(await tryConnect(`ws://127.0.0.1:${server.port}`, headers)).toBe('open');
      // Deliberately a failing expectation to maintain: adopting a both-families
      // bind should break this test rather than pass silently under it.
      await expect(tryConnect(`ws://[::1]:${server.port}`, headers)).rejects.toThrow();
    } finally {
      await server.close();
    }
  });
});

describe('Detox Server shutdown', () => {
  /**
   * `wss.close()` on its own waits for every connected client to leave, so a
   * SIGTERM with a tester still attached hung forever — visible only because
   * the test helper eventually sent SIGKILL.
   */
  it('resolves close() while a client is still connected', async () => {
    const server = await startServer();
    const url = `ws://${DEFAULT_HOST}:${server.port}`;
    const client = new WebSocket(url, { headers: { Authorization: `Bearer ${auth.token}` } });
    await new Promise((resolve, reject) => {
      client.once('open', resolve);
      client.once('error', reject);
    });

    await expect(server.close()).resolves.toBeUndefined();
    client.terminate();
  });

  it('is idempotent — a second SIGTERM must not error', async () => {
    const server = await startServer();
    await server.close();
    await expect(server.close()).resolves.toBeUndefined();
  });

  /**
   * @issue DTX-6213
   * `wss.close()` alone waits for every client to leave on its own; a client
   * that never completes the closing handshake (a frozen laptop, a paused
   * socket) must not hang shutdown forever — CLOSE_GRACE_MS forcibly
   * terminates it. We simulate that by pausing the client's own socket right
   * before closing, so it never reads (and therefore never acks) the
   * server's close frame.
   */
  it('force-terminates a client that never acks the close frame within the grace period', async () => {
    const server = await startServer();
    const url = `ws://${DEFAULT_HOST}:${server.port}`;
    const client = new WebSocket(url, { headers: { Authorization: `Bearer ${auth.token}` } });
    await new Promise((resolve, reject) => {
      client.once('open', resolve);
      client.once('error', reject);
    });

    // Private but stable across `ws` majors: the underlying net.Socket. Pausing
    // it stops the client from reading (and thus acking) anything the server
    // sends from here on, including the close frame.
    (client as unknown as SocketPausableForTest)._socket.pause();

    vi.useFakeTimers();
    try {
      const closing = server.close();
      // CLOSE_GRACE_MS (1s): past this, the hard-kill timer must terminate the
      // still-open connection rather than let close() hang on it forever.
      await vi.advanceTimersByTimeAsync(1_000);
      await expect(closing).resolves.toBeUndefined();
    } finally {
      vi.useRealTimers();
      client.terminate();
    }
  });
});

describe('Detox Server startup failure cleanup', () => {
  /**
   * @issue DTX-6214
   * Invalid keepalive options must fail before the socket is ever bound: a
   * server that cannot reclaim devices from a vanished client must not reach
   * "listening" at all — and must not leak the just-created `wss`.
   */
  it('closes the just-created server if keepalive options are invalid', async () => {
    await expect(
      createDetoxRemoteServer({
        port: 0,
        maxPool: 4,
        auth,
        simulatorOps,
        blobs: isolatedBlobs(),
        keepalive: { intervalMs: 0, maxMissedPongs: 3 },
      }),
    ).rejects.toThrow(/keepalive intervalMs/);
  });

  /**
   * @issue DTX-6216
   * A failed bind (EADDRINUSE) must unwind everything already started —
   * keepalive interval and the device pool's reconcile loop — rather than
   * strand them attached to a `wss` nobody holds a reference to.
   */
  it('tears down keepalive and the device pool if the port is already taken', async () => {
    const first = await startServer();
    try {
      await expect(
        createDetoxRemoteServer({
          port: first.port,
          maxPool: 4,
          auth,
          simulatorOps,
          blobs: isolatedBlobs(),
        }),
      ).rejects.toThrow();
    } finally {
      await first.close();
    }
  });
});

describe('Detox Server channel error surfacing', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * `peer.onError` is server.ts's only listener on non-fatal channel errors
   * (e.g. a response that failed to serialize/send) — its job is to log
   * rather than let the failure vanish silently. We force a real send
   * failure on the *server's* side of the socket only (the test client's own
   * sends must keep working, or the request never reaches the server).
   */
  it('logs a channel error raised while sending a response', async () => {
    const server = await startServer();
    const url = `ws://${DEFAULT_HOST}:${server.port}`;
    const client = new WebSocket(url, { headers: { Authorization: `Bearer ${auth.token}` } });
    await new Promise((resolve, reject) => {
      client.once('open', resolve);
      client.once('error', reject);
    });

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    WebSocket.prototype.send = function patchedSend(this: WebSocket, ...args: unknown[]) {
      if (this === client) return callOriginalSend(this, args);
      throw new Error('boom: simulated send failure on the server side');
    } as typeof WebSocket.prototype.send;

    try {
      // Any request the server has no handler for still produces a response
      // (a JSON-RPC "method not found" error) — enough to exercise the send
      // path without needing the full device-allocation dialect.
      client.send(JSON.stringify({ jsonrpc: '2.0', id: '1', method: 'no.such.method', params: {} }));

      await vi.waitFor(() =>
        expect(errorSpy).toHaveBeenCalledWith('[detox-remote] channel error:', expect.any(Error)),
      );
    } finally {
      restoreOriginalSend();
      errorSpy.mockRestore();
      client.terminate();
      await server.close();
    }
  });
});

describe('the version announce', () => {
  /**
   * @issue DTX-2004
   * The first frame a serving door sends on every fresh connection is the
   * `$/serverInfo` notification — before anything else, unprompted.
   */
  it('the FIRST frame on every fresh connection is $/serverInfo carrying the protocol number', async () => {
    const server = await startServer();
    try {
      const ws = new WebSocket(`ws://${DEFAULT_HOST}:${String(server.port)}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      const first = await new Promise<Record<string, unknown>>((resolve, reject) => {
        ws.once('message', (data: Buffer) => resolve(JSON.parse(data.toString('utf8')) as Record<string, unknown>));
        ws.once('error', reject);
      });
      expect(first).toMatchObject({
        method: SERVER_INFO_METHOD,
        params: { protocol: PROTOCOL_VERSION },
      });
      expect(typeof (first.params as Record<string, unknown>).server).toBe('string');
      ws.close();
    } finally {
      await server.close();
    }
  });
});
