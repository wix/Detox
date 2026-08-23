import { describe, it, expect } from 'vitest';
import { memoryChannel, Peer } from '..';

describe('channel close', () => {
  it('rejects pending requests and aborts running handlers', async () => {
    const [clientCh, serverCh] = memoryChannel();
    const client = Peer.create(clientCh);
    const server = Peer.create(serverCh);

    let serverSignalAborted = false;

    server.onRequest({
      method: 'hang',
      handler: async (_params, ctx) => {
        await new Promise((_, reject) => {
          ctx.signal.addEventListener('abort', () => {
            serverSignalAborted = true;
            reject(new Error('aborted'));
          });
        });
      },
    });

    const promise = client.request({ method: 'hang' });

    await new Promise((r) => setTimeout(r, 10));
    clientCh.close();

    await expect(promise).rejects.toThrow('Channel closed');
    expect(serverSignalAborted).toBe(true);
  });
});
