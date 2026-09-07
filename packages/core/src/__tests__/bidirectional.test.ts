import { describe, it, expect } from 'vitest';
import { memoryChannel, Peer } from '..';

describe('bidirectional requests', () => {
  it('both peers send requests to each other simultaneously', async () => {
    const [chA, chB] = memoryChannel();
    const peerA = Peer.create(chA);
    const peerB = Peer.create(chB);

    peerA.onRequest({
      method: 'ping',
      handler: async () => 'pong from A',
    });

    peerB.onRequest({
      method: 'ping',
      handler: async () => 'pong from B',
    });

    const [fromB, fromA] = await Promise.all([
      peerA.request<string>({ method: 'ping' }),
      peerB.request<string>({ method: 'ping' }),
    ]);

    expect(fromB).toBe('pong from B');
    expect(fromA).toBe('pong from A');
  });
});
