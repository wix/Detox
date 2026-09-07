/**
 * A message that arrives before any `onMessage` handler is attached must
 * not be lost. This is not hypothetical: a caller that dials by awaiting a
 * ws 'open' promise (`resolve(createWebSocketChannel(ws))` inside the
 * 'open' handler, `channel.onMessage(...)` only in the caller's `.then()`)
 * has a real gap — at least one microtask — between channel creation and
 * handler attachment. A peer that answers the instant it accepts the
 * connection can have its first frame arrive in the very same synchronous
 * turn as `open`. Spec 008's relay hit exactly that: a node's
 * `$/serverInfo`, sent synchronously on `wss.on('connection', ...)`, was
 * silently dropped by the dial-then-listen pattern in `upstream.ts`.
 */
import { describe, it, expect } from 'vitest';
import { WebSocketServer, WebSocket } from 'ws';

import { createWebSocketChannel, type WebSocketChannel } from '../channel/ws-channel';

interface Address {
  port: number;
}

interface Numbered {
  n: number;
}

interface TestServer {
  url: string;
  /** `wss.close()`'s callback waits for every client to disconnect first — a test's own channel.close() must run before this. */
  close(): Promise<void>;
}

async function startServer(onConnection: (ws: WebSocket) => void): Promise<TestServer> {
  const wss = new WebSocketServer({ port: 0 });
  wss.on('connection', onConnection);
  await new Promise<void>((resolve) => wss.once('listening', resolve));
  const { port } = wss.address() as Address;
  return {
    url: `ws://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve) => wss.close(() => resolve())),
  };
}

/** The exact hazard: channel creation and handler attachment split across a microtask. */
function dialLikeUpstream(url: string): Promise<WebSocketChannel> {
  const ws = new WebSocket(url);
  return new Promise((resolve) => {
    ws.once('open', () => resolve(createWebSocketChannel(ws)));
  });
}

describe('createWebSocketChannel — messages before any handler', () => {
  it("a message sent the instant the server accepts the connection is not lost to a caller who attaches onMessage a microtask later", async () => {
    const server = await startServer((ws) => {
      ws.send(JSON.stringify({ hello: 'immediate' }));
    });
    const channel = await dialLikeUpstream(server.url);
    try {
      const received = await new Promise((resolve) => {
        channel.onMessage(resolve);
      });
      expect(received).toEqual({ hello: 'immediate' });
    } finally {
      channel.close();
      await server.close();
    }
  });

  it('queues several early messages and flushes them, in order, to the first handler', async () => {
    const server = await startServer((ws) => {
      ws.send(JSON.stringify({ n: 1 }));
      ws.send(JSON.stringify({ n: 2 }));
      ws.send(JSON.stringify({ n: 3 }));
    });
    const channel = await dialLikeUpstream(server.url);
    try {
      const seen: unknown[] = [];
      await new Promise<void>((resolve) => {
        channel.onMessage((msg) => {
          seen.push(msg);
          if (seen.length === 3) resolve();
        });
      });
      expect(seen).toEqual([{ n: 1 }, { n: 2 }, { n: 3 }]);
    } finally {
      channel.close();
      await server.close();
    }
  });

  it('a message after the first handler is already attached dispatches directly, never through the queue', async () => {
    const server = await startServer((ws) => {
      // No early message this time — the client attaches first.
      ws.on('message', () => {
        ws.send(JSON.stringify({ reply: true }));
      });
    });
    const channel = await dialLikeUpstream(server.url);
    try {
      const received = new Promise((resolve) => channel.onMessage(resolve));
      channel.send({ ping: true });
      expect(await received).toEqual({ reply: true });
    } finally {
      channel.close();
      await server.close();
    }
  });

  it('bounds the queue: only the most recent PENDING_CAP messages survive to the first handler', async () => {
    const total = 40;
    const server = await startServer((ws) => {
      for (let i = 0; i < total; i += 1) ws.send(JSON.stringify({ n: i }));
    });
    const channel = await dialLikeUpstream(server.url);
    try {
      // Give every send a chance to land before attaching the handler —
      // otherwise this test would only prove the single-turn case above.
      await new Promise((resolve) => setTimeout(resolve, 50));
      const seen: Numbered[] = [];
      await new Promise<void>((resolve) => {
        channel.onMessage((msg) => {
          seen.push(msg as Numbered);
          resolve();
        });
      });
      expect(seen.length).toBeGreaterThan(0);
      expect(seen.length).toBeLessThan(total);
      // Oldest-first: the survivors are a contiguous, increasing tail.
      for (let i = 1; i < seen.length; i += 1) expect(seen[i].n).toBe(seen[i - 1].n + 1);
      expect(seen[seen.length - 1].n).toBe(total - 1);
    } finally {
      channel.close();
      await server.close();
    }
  });
});
