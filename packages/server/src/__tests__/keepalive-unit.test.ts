import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'node:events';
import type { WebSocketServer } from 'ws';

import { startKeepalive, KEEPALIVE_OFF, DEFAULT_KEEPALIVE } from '../keepalive';

/**
 * The real-socket tests in keepalive.test.ts prove the feature end to end but
 * cannot see the accounting: off-by-one windows, counter resets, the
 * close-then-terminate state machine, the flush grace. This suite drives
 * `startKeepalive` tick by tick under fake timers, where every boundary is a
 * number, not a sleep.
 */

class FakeSocket extends EventEmitter {
  ping = vi.fn();
  close = vi.fn();
  terminate = vi.fn();
  bufferedAmount = 0;

  pong(): void {
    this.emit('pong');
  }
}

class FakeServer extends EventEmitter {
  clients = new Set<FakeSocket>();

  connect(): FakeSocket {
    const ws = new FakeSocket();
    this.clients.add(ws);
    this.emit('connection', ws);
    return ws;
  }
}

const asWss = (server: FakeServer) => server as unknown as WebSocketServer;

const INTERVAL = 100;
const MISSES = 3;

describe('startKeepalive accounting', () => {
  let server: FakeServer;
  let stop: (() => void) | undefined;

  beforeEach(() => {
    vi.useFakeTimers();
    server = new FakeServer();
    stop = undefined;
  });

  afterEach(() => {
    stop?.();
    vi.useRealTimers();
  });

  const start = (intervalMs = INTERVAL, maxMissedPongs = MISSES) => {
    stop = startKeepalive(asWss(server), { intervalMs, maxMissedPongs });
  };
  const tick = (n = 1) => vi.advanceTimersByTime(n * INTERVAL);

  /**
   * @issue DTX-6138
   * The operator's explicit opt-out: no liveness polls,
   * never reclaim on silence. The cost is the operator's own: devices a
   * silently dead client held stay busy until the server restarts.
   */
  it('KEEPALIVE_OFF really is off: no pings, no closes, ever', () => {
    stop = startKeepalive(asWss(server), KEEPALIVE_OFF);
    const ws = server.connect();
    // Far past any conceivable window: a whole default cycle and then some.
    vi.advanceTimersByTime(DEFAULT_KEEPALIVE.intervalMs * (DEFAULT_KEEPALIVE.maxMissedPongs + 2));
    expect(ws.ping).not.toHaveBeenCalled();
    expect(ws.close).not.toHaveBeenCalled();
    expect(ws.terminate).not.toHaveBeenCalled();
    stop(); // and the no-op stop is still a callable stop
    stop = undefined;
  });

  it('the default window is 2 minutes (40s × 3 misses)', () => {
    expect(DEFAULT_KEEPALIVE.intervalMs * DEFAULT_KEEPALIVE.maxMissedPongs).toBe(120_000);
  });

  /**
   * @issue DTX-6139
   * 0 misses closes everyone unpinged; an overflowing interval becomes a
   * 1ms ping storm (Node clamps 32-bit timer overflow) that kills every
   * client — the opposite of the "generous" number the caller typed.
   */
  it('rejects options that would misbehave instead of honoring them literally', () => {
    expect(() => start(0)).toThrow(/intervalMs/);
    expect(() => start(2_147_483_648)).toThrow(/intervalMs/);
    expect(() => start(Number.NaN)).toThrow(/intervalMs/);
    expect(() => start(INTERVAL, 0)).toThrow(/maxMissedPongs/);
    expect(() => start(INTERVAL, 1.5)).toThrow(/maxMissedPongs/);
  });

  /**
   * @issue DTX-6136
   * The grace window is `maxMissedPongs × intervalMs` to
   * `(maxMissedPongs + 1) × intervalMs`, depending on where in the tick
   * the silence started; the hard terminate follows one interval after
   * the close frame.
   * @issue DTX-6144
   * A close frame first, terminate one tick later: a genuinely dead peer
   * never reads it and loses nothing, but a client whose event loop was
   * merely paused (a debugger breakpoint) usually finds the frame
   * buffered on resume and can report why its session ended instead of
   * a generic disconnect.
   */
  it('gives a silent client exactly maxMissedPongs pings before the close frame', () => {
    start();
    const ws = server.connect();

    tick(MISSES);
    expect(ws.ping).toHaveBeenCalledTimes(MISSES);
    expect(ws.close).not.toHaveBeenCalled();

    tick();
    expect(ws.close).toHaveBeenCalledExactlyOnceWith(
      4001,
      expect.stringMatching(/^keepalive: no pong within ~0\.3s — a long pause ends your session$/),
    );
    expect(ws.terminate).not.toHaveBeenCalled();

    // Close frame flushed (nothing buffered) — the hard terminate follows one
    // tick later, and the socket is not pinged or re-closed meanwhile.
    tick();
    expect(ws.terminate).toHaveBeenCalledTimes(1);
    expect(ws.close).toHaveBeenCalledTimes(1);
    expect(ws.ping).toHaveBeenCalledTimes(MISSES);
  });

  /**
   * @issue DTX-6140
   * Silence is counted in consecutive missed pongs, not a single missed
   * one: the `ws` client answers pings from its event loop, so anything
   * that stalls that loop for one tick — a paused debugger, a CPU-bound
   * test step — would otherwise cost the developer their connection and
   * every device on it.
   */
  it('a pong resets the counter — only consecutive silence kills', () => {
    start();
    const ws = server.connect();

    tick(MISSES);
    ws.pong();
    tick(MISSES);
    expect(ws.close).not.toHaveBeenCalled();

    tick();
    expect(ws.close).toHaveBeenCalledTimes(1);
  });

  /**
   * @issue DTX-6142
   * Past the close frame the counter no longer votes: a nonconforming
   * peer that answers pings but never echoes the close frame must not
   * dodge the terminate by resetting the counter — that would delegate
   * reclaim to ws's own 30s (ref'd!) close timer.
   */
  it('a pong after the close frame does not win a reprieve', () => {
    start();
    const ws = server.connect();

    tick(MISSES + 1);
    expect(ws.close).toHaveBeenCalledTimes(1);

    ws.pong();
    tick();
    expect(ws.terminate).toHaveBeenCalledTimes(1);
  });

  /**
   * @issue DTX-6143
   * Destroying the socket discards whatever is queued, including the
   * close frame with the reason the client was meant to read on resume.
   * A slow but draining peer gets a bounded grace; a paused peer never
   * drains and the countdown wins.
   */
  it('defers the terminate while the close frame is still draining — boundedly', () => {
    start();
    const ws = server.connect();

    tick(MISSES + 1);
    expect(ws.close).toHaveBeenCalledTimes(1);

    ws.bufferedAmount = 8_000_000;
    tick(MISSES);
    expect(ws.terminate).not.toHaveBeenCalled();

    tick();
    expect(ws.terminate).toHaveBeenCalledTimes(1);
  });

  it('terminates immediately once a draining buffer empties', () => {
    start();
    const ws = server.connect();

    tick(MISSES + 1);
    ws.bufferedAmount = 500;
    tick();
    expect(ws.terminate).not.toHaveBeenCalled();

    ws.bufferedAmount = 0;
    tick();
    expect(ws.terminate).toHaveBeenCalledTimes(1);
  });

  /**
   * @issue DTX-6141
   * Both clients arriving later and clients already connected when
   * keepalive starts are adopted: without adoption a pre-existing client
   * never gets a pong listener, so its counter can never reset and a
   * perfectly healthy client dies in `maxMissedPongs + 1` ticks — exactly
   * what a stop()/start() reconfiguration cycle would otherwise do to
   * every live session.
   */
  it('adopts clients that were connected before keepalive started', () => {
    const ws = new FakeSocket();
    server.clients.add(ws);
    start();

    for (let i = 0; i < MISSES * 3; i++) {
      tick();
      ws.pong();
    }
    expect(ws.close).not.toHaveBeenCalled();
    expect(ws.ping).toHaveBeenCalledTimes(MISSES * 3);
  });

  it('stop() halts pinging and stops adopting', () => {
    start();
    const before = server.connect();
    stop?.();
    stop = undefined;

    tick(MISSES * 2);
    expect(before.ping).not.toHaveBeenCalled();
    expect(server.listenerCount('connection')).toBe(0);
  });
});
