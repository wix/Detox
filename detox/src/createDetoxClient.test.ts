import { describe, it, expect, afterEach } from 'vitest';
import type { AddressInfo } from 'node:net';
import { WebSocketServer } from 'ws';

import { createDetoxClient } from './createDetoxClient';
import { DetoxClientPeer } from './DetoxClientPeer';

interface WireRequestEnvelope {
  id: string;
  method: string;
}

/**
 * A real `ws` server on `127.0.0.1:0` (OS-assigned port) — no simctl, no
 * Detox Server, just enough JSON-RPC to prove `createDetoxClient` actually
 * connects, wraps the socket in a working client peer, and that `close()`
 * really tears the channel down rather than just closing the raw socket.
 */
describe('createDetoxClient', () => {
  let server: WebSocketServer | undefined;

  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve) => server!.close(() => resolve()));
      server = undefined;
    }
  });

  function startServer(): Promise<string> {
    return new Promise((resolve) => {
      server = new WebSocketServer({ port: 0 }, () => {
        const { port } = server!.address() as AddressInfo;
        resolve(`ws://127.0.0.1:${port}`);
      });
    });
  }

  it('connects, returns a working DetoxClientPeer, and close() tears the channel down', async () => {
    const url = await startServer();
    server!.on('connection', (socket) => {
      socket.on('message', (data: Buffer) => {
        const msg = JSON.parse(data.toString('utf8')) as WireRequestEnvelope;
        socket.send(
          JSON.stringify({
            jsonrpc: '2.0',
            id: msg.id,
            result: {
              allocationId: 'a1',
              name: 'iPhone 17',
              os: '17',
              state: 'booted',
              device: { udid: 'u1' },
            },
          }),
        );
      });
    });

    const detox = await createDetoxClient({ url });
    expect(detox.client).toBeInstanceOf(DetoxClientPeer);

    const response = await detox.client.allocateDevice({ type: 'ios.simulator' } as never);
    expect(response).toEqual(expect.objectContaining({ allocationId: 'a1' }));

    detox.close();

    // close() tears down the channel synchronously — a call issued right
    // after must fail immediately rather than hang on a socket going away.
    await expect(detox.client.bootDevice({ allocationId: 'a1' })).rejects.toThrow();
  });

  it('rejects rather than hanging when there is nobody listening at the url', async () => {
    const url = await startServer();
    await new Promise<void>((resolve) => server!.close(() => resolve()));
    server = undefined;

    await expect(createDetoxClient({ url })).rejects.toThrow();
  });
});
