/**
 * The upstream dial (spec 008 auth + keepalive riders), over real sockets:
 * hop-pairwise credentials on the handshake, typed dial failures the fan-out
 * classifies, and the `ws` auto-pong the whole per-hop keepalive story turns
 * on — recorded as unverified in scoping, pinned here before anything relies
 * on it.
 */
import { describe, it, expect } from 'vitest';
import { WebSocketServer, type WebSocket as ServerSocket } from 'ws';
import type { IncomingMessage } from 'node:http';

import { DetoxErrorCode } from '@detox-remote/core';

import { dialNodeChannel } from '../upstream';
import type { RelayNodeConfig } from '../nodes';

interface VerifyInfo {
  req: IncomingMessage;
}

interface FakeNodeServer {
  port: number;
  headers: (string | undefined)[];
  sockets: ServerSocket[];
  close(): Promise<void>;
}

function listen(verify?: (req: IncomingMessage) => boolean): Promise<FakeNodeServer> {
  const headers: (string | undefined)[] = [];
  const sockets: ServerSocket[] = [];
  const wss = new WebSocketServer({
    host: '127.0.0.1',
    port: 0,
    verifyClient: verify
      ? ({ req }: VerifyInfo, done: (ok: boolean, code?: number, msg?: string) => void) => {
          if (verify(req)) return done(true);
          done(false, 401, 'Unauthorized');
        }
      : undefined,
  });
  wss.on('connection', (ws, req) => {
    headers.push(req.headers.authorization);
    sockets.push(ws);
  });
  return new Promise((resolve) => {
    wss.once('listening', () => {
      const addr = wss.address();
      resolve({
        port: typeof addr === 'object' && addr ? addr.port : 0,
        headers,
        sockets,
        close: () =>
          new Promise((done) => {
            for (const ws of wss.clients) ws.terminate();
            wss.close(() => done());
          }),
      });
    });
  });
}

const nodeConfig = (port: number, token = 'node-token-1'): RelayNodeConfig => ({
  name: 'mac-a',
  url: `ws://127.0.0.1:${String(port)}`,
  token,
});

describe('dialNodeChannel', () => {
  it('presents the NODE\'s bearer token on the handshake — hop-pairwise', async () => {
    const server = await listen();
    try {
      const channel = await dialNodeChannel(nodeConfig(server.port, 'the-node-secret'));
      expect(server.headers).toEqual(['Bearer the-node-secret']);
      channel.close();
    } finally {
      await server.close();
    }
  });

  /**
   * @issue DTX-7045
   * A 401 at the handshake means the relay's own token for that node is
   * wrong. It rejects `DETOX_UNAUTHORIZED`, the row the fan-out logs
   * loudly and names in the aggregate, rather than treating it as a plain
   * unreachable node.
   */
  it('maps a 401 handshake to DETOX_UNAUTHORIZED — the loud-log, name-in-aggregate row', async () => {
    const server = await listen(() => false);
    try {
      await expect(dialNodeChannel(nodeConfig(server.port))).rejects.toMatchObject({
        code: DetoxErrorCode.DETOX_UNAUTHORIZED,
      });
    } finally {
      await server.close();
    }
  });

  it('maps a refused dial to DETOX_SERVER_UNREACHABLE — the try-next row', async () => {
    // Grab a port, then free it: nothing listens there.
    const server = await listen();
    const port = server.port;
    await server.close();
    await expect(dialNodeChannel(nodeConfig(port))).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_SERVER_UNREACHABLE,
    });
  });

  it('answers a node\'s protocol pings automatically — the per-hop keepalive premise, verified', async () => {
    const server = await listen();
    try {
      const channel = await dialNodeChannel(nodeConfig(server.port));
      const nodeSide = server.sockets[0];
      const ponged = new Promise<boolean>((resolve) => {
        nodeSide.once('pong', () => resolve(true));
        setTimeout(() => resolve(false), 2_000).unref();
      });
      nodeSide.ping();
      expect(await ponged).toBe(true);
      channel.close();
    } finally {
      await server.close();
    }
  });
});
