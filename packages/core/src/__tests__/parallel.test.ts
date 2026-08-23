import { describe, it, expect } from 'vitest';
import { memoryChannel, Peer } from '..';

interface EchoParams {
  value: number;
  delay: number;
}

describe('parallel requests', () => {
  it('handles 3 concurrent requests with correct results', async () => {
    const [clientCh, serverCh] = memoryChannel();
    const client = Peer.create(clientCh);
    const server = Peer.create(serverCh);

    server.onRequest({
      method: 'echo',
      handler: async (params) => {
        const { value, delay } = params as EchoParams;
        await new Promise((r) => setTimeout(r, delay));
        return value * 2;
      },
    });

    const results = await Promise.all([
      client.request<number>({ method: 'echo', params: { value: 1, delay: 30 } }),
      client.request<number>({ method: 'echo', params: { value: 2, delay: 20 } }),
      client.request<number>({ method: 'echo', params: { value: 3, delay: 10 } }),
    ]);

    expect(results).toEqual([2, 4, 6]);
  });
});
