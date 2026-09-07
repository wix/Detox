import { describe, it, expect } from 'vitest';
import { memoryChannel, Peer } from '..';

interface EchoParams {
  message: string;
}
interface EchoResult {
  echoed: string;
}
interface PingParams {
  from: string;
}

describe('typed Peer helpers', () => {
  it('createMethod and createMethodHandler round-trip typed params and result', async () => {
    const [chA, chB] = memoryChannel();
    const peerA = Peer.create(chA);
    const peerB = Peer.create(chB);

    peerB.createMethodHandler<EchoParams, EchoResult>('echo')(async (params) => {
      return { echoed: params.message };
    });

    const echo = peerA.createMethod<EchoParams, EchoResult>('echo');
    const result = await echo({ message: 'hello' });

    expect(result).toEqual({ echoed: 'hello' });
  });

  it('createNotification and createNotificationHandler deliver typed params', async () => {
    const [chA, chB] = memoryChannel();
    const peerA = Peer.create(chA);
    const peerB = Peer.create(chB);

    const received: PingParams[] = [];
    peerB.createNotificationHandler<PingParams>('ping')((params) => {
      received.push(params);
    });

    const ping = peerA.createNotification<PingParams>('ping');
    ping({ from: 'client' });
    ping({ from: 'test' });

    await new Promise((r) => setTimeout(r, 10));
    expect(received).toEqual([{ from: 'client' }, { from: 'test' }]);
  });

  it('createMethod passes CallOptions (signal, onProgress)', async () => {
    const [chA, chB] = memoryChannel();
    const peerA = Peer.create(chA);
    const peerB = Peer.create(chB);

    peerB.createMethodHandler<EchoParams, EchoResult>('echo')(async (params, ctx) => {
      ctx.progress({ step: 1 });
      ctx.progress({ step: 2 });
      return { echoed: params.message };
    });

    const progressValues: unknown[] = [];
    const echo = peerA.createMethod<EchoParams, EchoResult>('echo');
    const result = await echo(
      { message: 'hi' },
      { onProgress: (value) => progressValues.push(value) },
    );

    expect(result).toEqual({ echoed: 'hi' });
    expect(progressValues).toEqual([{ step: 1 }, { step: 2 }]);
  });
});
