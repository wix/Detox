import { describe, it, expect } from 'vitest';
import { memoryChannel, Peer } from '..';

/**
 * @issue DTX-1016
 * A channel's close listeners are additive, not a single slot. `Peer.create`
 * registers a close listener of its own — the one that aborts every handler
 * still running on that connection. If the owner sitting above the peer (the
 * server, reclaiming devices) registered a second one and silently displaced
 * it, a dying socket would stop cancelling in-flight work: `simctl` children
 * would outlive the tester.
 */
describe('channel close listeners', () => {
  it('notifies every listener, not just the last one registered', () => {
    const [a] = memoryChannel();
    const called: string[] = [];

    a.onClose(() => called.push('first'));
    a.onClose(() => called.push('second'));
    a.close();

    expect(called).toEqual(['first', 'second']);
  });

  it('fires each listener exactly once', () => {
    const [a] = memoryChannel();
    let count = 0;

    a.onClose(() => count++);
    a.close();
    a.close();

    expect(count).toBe(1);
  });

  it('still aborts running handlers when the owner also listens for close', async () => {
    const [clientCh, serverCh] = memoryChannel();
    const client = Peer.create(clientCh);
    const server = Peer.create(serverCh);

    // The owner registers *after* Peer.create did — the order that used to lose
    // the peer's listener.
    let ownerNotified = false;
    serverCh.onClose(() => {
      ownerNotified = true;
    });

    let handlerAborted = false;
    server.onRequest({
      method: 'hang',
      handler: (_params, ctx) =>
        new Promise((_resolve, reject) => {
          ctx.signal.addEventListener('abort', () => {
            handlerAborted = true;
            reject(new Error('aborted'));
          });
        }),
    });

    const pending = client.request({ method: 'hang' });
    await new Promise((r) => setTimeout(r, 10));
    clientCh.close();

    await expect(pending).rejects.toThrow('Channel closed');
    expect(handlerAborted).toBe(true);
    expect(ownerNotified).toBe(true);
  });
});
