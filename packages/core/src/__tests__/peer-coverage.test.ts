import { describe, it, expect, vi } from 'vitest';

import { Peer } from '../peer';
import type { Channel, CloseHandler, ErrorHandler } from '../channel';

/**
 * A minimal hand-rolled `Channel` — deliberately not `memoryChannel`, whose
 * `onError` is a documented no-op ("messages pass through as live
 * references, never JSON — nothing to fail"). `Peer`'s constructor wires
 * `_channel.onError((err) => this._onError(err))` unconditionally; this fake
 * is the seam that lets a test actually fire it — and `fireClose` is the
 * seam for the dead-socket fixture below.
 */
interface FakeChannel extends Channel {
  fireError(err: Error): void;
  fireClose(): void;
}

function fakeChannel(): FakeChannel {
  let errorHandler: ErrorHandler | undefined;
  let closeHandler: CloseHandler | undefined;
  return {
    send: () => {
      // Dropped on the floor: nothing ever answers a request sent here,
      // which is exactly the "no cancellation ack ever arrives" fixture the
      // cancellation tests below need.
    },
    onMessage: () => {},
    onClose: (handler) => {
      closeHandler = handler;
    },
    onError: (handler) => {
      errorHandler = handler;
    },
    fireError: (err) => {
      errorHandler?.(err);
    },
    fireClose: () => {
      closeHandler?.();
    },
  };
}

describe('Peer — channel error wiring', () => {
  it('propagates a channel error to onError listeners', () => {
    const channel = fakeChannel();
    const peer = Peer.create(channel);
    const seen: Error[] = [];
    peer.onError((err) => seen.push(err));

    const boom = new Error('send() could not serialize the payload');
    channel.fireError(boom);

    expect(seen).toEqual([boom]);
  });

  it('fans an error out to every registered listener, isolating none from the others', () => {
    const channel = fakeChannel();
    const peer = Peer.create(channel);
    const first: Error[] = [];
    const second: Error[] = [];
    peer.onError((err) => first.push(err));
    peer.onError((err) => second.push(err));

    const boom = new Error('boom');
    channel.fireError(boom);

    expect(first).toEqual([boom]);
    expect(second).toEqual([boom]);
  });
});

describe('Peer — an aborted call settles on an answer or on close, never on a clock', () => {
  /**
   * @issue DTX-1009
   * Aborting a request does not reject it immediately: the caller's promise
   * stays pending until the remote side acknowledges the `$/cancelRequest`
   * (any response settles it) or the channel closes. No grace timer: a clock
   * shorter than a real rollback reports a determinable outcome as
   * `unknown` while the true answer is en route; a dead peer is a transport
   * event and settles everything through `_onClose`. This fixture's channel
   * drops every `send()` on the floor, so no ack — and no response at all —
   * ever arrives.
   */
  it('outwaits any amount of silence on a live channel — no timer settles it', async () => {
    vi.useFakeTimers();
    try {
      const channel = fakeChannel();
      const peer = Peer.create(channel);
      const ac = new AbortController();

      let settled = false;
      const promise = peer.request({ method: 'slow', signal: ac.signal });
      // Two-armed: a regression that resolved the aborted call must trip
      // `settled` too, not slip past a rejection-only observer.
      promise.then(
        () => {
          settled = true;
        },
        () => {
          settled = true;
        },
      );
      ac.abort(new Error('caller gave up'));

      // Far beyond any grace window and beyond every server-side child
      // deadline: a real rollback may take a minute, and only the peer's
      // own answer may settle the call.
      await vi.advanceTimersByTimeAsync(600_000);
      expect(settled).toBe(false);
      expect(vi.getTimerCount()).toBe(0); // no clock is even armed

      // The one backstop: the channel dying settles the call, and `unknown`
      // is then literally true — the socket died between the cancellation
      // and its acknowledgment.
      const rejection = expect(promise).rejects.toMatchObject({
        name: 'AbortError',
        details: { outcome: 'unknown' },
      });
      channel.fireClose();
      await rejection;
    } finally {
      vi.useRealTimers();
    }
  });
});
