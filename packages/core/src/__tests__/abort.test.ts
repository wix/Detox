import { describe, it, expect } from 'vitest';
import { memoryChannel, Peer } from '..';

describe('request cancellation', () => {
  it('aborts mid-flight and rejects with AbortError', async () => {
    const [clientCh, serverCh] = memoryChannel();
    const client = Peer.create(clientCh);
    const server = Peer.create(serverCh);

    let serverSignalAborted = false;

    server.onRequest({
      method: 'slow',
      handler: async (_params, ctx) => {
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(resolve, 1000);
          ctx.signal.addEventListener('abort', () => {
            clearTimeout(timeout);
            serverSignalAborted = true;
            reject(new DOMException('Aborted', 'AbortError'));
          });
        });
        return 'should not reach';
      },
    });

    const ac = new AbortController();
    const promise = client.request({ method: 'slow', signal: ac.signal });

    setTimeout(() => ac.abort(), 10);

    await expect(promise).rejects.toThrow('Aborted');
    await new Promise((r) => setTimeout(r, 20));
    expect(serverSignalAborted).toBe(true);
  });

  it('rejects immediately if signal already aborted', async () => {
    const [clientCh, serverCh] = memoryChannel();
    const client = Peer.create(clientCh);
    Peer.create(serverCh);

    const ac = new AbortController();
    ac.abort();

    await expect(
      client.request({ method: 'any', signal: ac.signal })
    ).rejects.toThrow('Aborted');
  });

  /**
   * @issue DTX-1010
   * The one-abort-two-consequences shape: the session signal both cancels
   * the caller and tears the channel down synchronously. A request made
   * after both must reject as `AbortError` (2003), never "Peer is closed"
   * (2006) — the caller aborted first, and the close is downstream of that
   * same abort.
   */
  it('an already-aborted signal beats a closed peer: the abort explains the close', async () => {
    const [clientCh, serverCh] = memoryChannel();
    const client = Peer.create(clientCh);
    Peer.create(serverCh);

    const ac = new AbortController();
    ac.abort();
    clientCh.close();

    await expect(
      client.request({ method: 'any', signal: ac.signal })
    ).rejects.toThrow('Aborted');
  });
});
