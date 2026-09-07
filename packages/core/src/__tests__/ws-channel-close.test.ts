import { describe, it, expect } from 'vitest';
import { WebSocketServer, WebSocket } from 'ws';

import { createWebSocketChannel } from '../channel/ws-channel';

interface Address {
  port: number;
}

interface ServerFixture {
  wss: WebSocketServer;
  url: string;
}

async function startServer(): Promise<ServerFixture> {
  const wss = new WebSocketServer({ port: 0 });
  await new Promise<void>((resolve) => wss.once('listening', resolve));
  const { port } = wss.address() as Address;
  return { wss, url: `ws://127.0.0.1:${port}` };
}

async function connectedClient(url: string): Promise<WebSocket> {
  const client = new WebSocket(url);
  await new Promise<void>((resolve, reject) => {
    client.once('open', resolve);
    client.once('error', reject);
  });
  return client;
}

describe('createWebSocketChannel — local close()', () => {
  /**
   * @issue DTX-1015
   * A local close carries no close frame yet — `fireClose()` runs with no
   * argument so whoever sits on top (the Peer) settles right away rather
   * than waiting on a 'close' event the `closed` flag will mute.
   */
  it('fires onClose immediately, closes the socket, and is idempotent', async () => {
    const { wss, url } = await startServer();
    try {
      const client = await connectedClient(url);
      const channel = createWebSocketChannel(client);
      const closes: unknown[] = [];
      channel.onClose((info) => closes.push(info));

      channel.close();

      expect(closes).toEqual([undefined]);
      expect([WebSocket.CLOSING, WebSocket.CLOSED]).toContain(client.readyState);

      // A second close() must not fire onClose again — `closed` latches.
      channel.close();
      expect(closes).toEqual([undefined]);
    } finally {
      wss.close();
    }
  });

  it('closing a socket that never finished connecting still closes it and fires onClose once', async () => {
    const { wss, url } = await startServer();
    try {
      // No `await` on open: readyState is CONNECTING when `close()` runs.
      const client = new WebSocket(url);
      const channel = createWebSocketChannel(client);
      const closes: unknown[] = [];
      channel.onClose((info) => closes.push(info));

      channel.close();

      expect(closes).toEqual([undefined]);
    } finally {
      wss.close();
    }
  });
});

describe('createWebSocketChannel — raw socket errors', () => {
  /**
   * @issue DTX-1014
   * The channel wires a no-op onto the raw `error` event: `ws` always
   * follows 'error' with 'close', and firing `onClose` from the error
   * listener would latch `closed` before the close frame's code/reason (the
   * payload `onClose` consumers rely on) arrive. Exercises that listener
   * directly, then confirms the close frame — not the error — is what
   * settles it.
   */
  it('does not itself settle onClose — the close frame that follows does', async () => {
    const { wss, url } = await startServer();
    try {
      const client = await connectedClient(url);
      const channel = createWebSocketChannel(client);
      const closes: unknown[] = [];
      channel.onClose((info) => closes.push(info));

      client.emit('error', new Error('synthetic socket error'));
      expect(closes).toEqual([]);

      client.close();
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(closes.length).toBe(1);
    } finally {
      wss.close();
    }
  });
});
