import { describe, it, expect } from 'vitest';
import { memoryChannel, Peer } from '..';

describe('progress notifications', () => {
  it('receives progress events in order before promise settles', async () => {
    const [clientCh, serverCh] = memoryChannel();
    const client = Peer.create(clientCh);
    const server = Peer.create(serverCh);

    server.onRequest({
      method: 'work',
      handler: async (_params, ctx) => {
        ctx.progress({ step: 1 });
        ctx.progress({ step: 2 });
        return 'done';
      },
    });

    const progressEvents: unknown[] = [];
    const result = await client.request<string>({
      method: 'work',
      onProgress: (value) => progressEvents.push(value),
    });

    expect(progressEvents).toEqual([{ step: 1 }, { step: 2 }]);
    expect(result).toBe('done');
  });
});
