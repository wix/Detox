import { describe, it, expect, vi } from 'vitest';
import { memoryChannel } from '..';

/**
 * @issue DTX-1017
 * `Channel.onMessage` is additive, not a single slot: an owner sitting above
 * a `Peer` that also wants to see raw traffic must not be able to unplug it
 * by mistake — the same class of guarantee `close-listeners.test.ts` covers
 * for `onClose`.
 */
describe('channel message listeners', () => {
  it('notifies every listener, not just the last one registered', () => {
    const [a, b] = memoryChannel();
    const received: Array<[string, unknown]> = [];

    b.onMessage((msg) => received.push(['first', msg]));
    b.onMessage((msg) => received.push(['second', msg]));

    a.send({ hello: 'world' });

    expect(received).toEqual([
      ['first', { hello: 'world' }],
      ['second', { hello: 'world' }],
    ]);
  });

  /**
   * @issue DTX-1018
   * `dispatchMessage` isolates each message listener from the others'
   * throws — without it, a throwing listener would propagate straight into
   * the sender's own `send()` call, which is worse than the ws transport's
   * version of this bug (there it at least stays inside the receiver's own
   * event handler).
   */
  it("isolates a throwing listener from the others, and from the sender's own call", () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const [a, b] = memoryChannel();
      const received: unknown[] = [];

      b.onMessage(() => {
        throw new Error('this listener is broken');
      });
      b.onMessage((msg) => received.push(msg));

      expect(() => a.send({ hello: 'world' })).not.toThrow();
      expect(received).toEqual([{ hello: 'world' }]);
    } finally {
      vi.restoreAllMocks();
    }
  });
});
