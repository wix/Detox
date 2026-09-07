import type { WebSocketServer, WebSocket } from 'ws';
import { serverLog } from './log-sink';

export interface KeepaliveOptions {
  /** How often the server pings every connected client. */
  intervalMs: number;
  /**
   * How many consecutive intervals a client may stay silent before its
   * connection is closed.
   * @issue DTX-6136: the grace window is `maxMissedPongs × intervalMs` to `(maxMissedPongs + 1) × intervalMs`, then one more interval to terminate.
   */
  maxMissedPongs: number;
}

/**
 * A slept laptop or a dropped wifi leaves a half-open TCP connection: the
 * server never observes a close, so every device that client held stays busy
 * until the server restarts. Protocol-level ping/pong is the only implicit
 * reclaim we have (the connection is the lease), so a client that stops
 * answering is terminated — and terminating fires the same 'close' event a
 * clean disconnect fires, which is what hands its devices back.
 * 40s × 3 misses is the 2-minute default window.
 */
export const DEFAULT_KEEPALIVE: KeepaliveOptions = {
  intervalMs: 40_000,
  maxMissedPongs: 3,
};

/**
 * @issue DTX-6138: the operator's explicit opt-out — no liveness polls, never reclaim on silence.
 * The cost is the operator's own: devices a silently dead client held stay
 * busy until the server restarts.
 */
export const KEEPALIVE_OFF = 'off';

export type KeepaliveConfig = KeepaliveOptions | typeof KEEPALIVE_OFF;

/** @issue DTX-6139: Node clamps larger timeouts to 1ms — a ping storm, the opposite of "generous". */
const MAX_TIMER_MS = 2_147_483_647;

interface Accounting {
  /** Consecutive intervals without a pong. */
  missed: number;
  /** Set once the close frame went out; counts down the flush grace. */
  terminateInTicks?: number;
}

/**
 * Starts pinging every client of `wss` — the ones already connected too — and
 * returns the stop function.
 * @issue DTX-6140: silence is counted in consecutive missed pongs, not a single missed one.
 */
export function startKeepalive(
  wss: WebSocketServer,
  config: KeepaliveConfig = DEFAULT_KEEPALIVE,
  // Who is talking, for the silent-client log line — the relay reuses this
  // wholesale on its client hop (spec 008) and must not talk like a server.
  logPrefix = '[detox-remote]',
): () => void {
  if (config === KEEPALIVE_OFF) {
    // @issue DTX-6138: a legal, explicit "no polls at all" — not a window so large it never fires, but genuinely no timer.
    return () => undefined;
  }
  const { intervalMs, maxMissedPongs } = config;
  if (!Number.isFinite(intervalMs) || intervalMs < 1 || intervalMs > MAX_TIMER_MS) {
    throw new Error(`keepalive intervalMs must be between 1 and ${MAX_TIMER_MS}, got: ${intervalMs}`);
  }
  if (!Number.isInteger(maxMissedPongs) || maxMissedPongs < 1) {
    throw new Error(`keepalive maxMissedPongs must be a positive integer, got: ${maxMissedPongs}`);
  }

  // WeakMap keyed by socket rather than state on the socket: a terminated
  // client leaves `wss.clients` and its entry dies with it — no sweep needed.
  const accounting = new WeakMap<WebSocket, Accounting>();

  function adopt(ws: WebSocket): Accounting {
    const acc: Accounting = { missed: 0 };
    accounting.set(ws, acc);
    ws.on('pong', () => {
      acc.missed = 0;
    });
    return acc;
  }

  // @issue DTX-6141: both clients arriving later and clients already connected are adopted — a stop()/start() cycle needs both.
  wss.on('connection', adopt);
  for (const ws of wss.clients) adopt(ws);

  const timer = setInterval(() => {
    for (const ws of wss.clients) {
      // Adoption above makes this branch unreachable today; it is a safety
      // net for a `clients` member neither hook saw, not a supported state.
      const acc = accounting.get(ws) ?? adopt(ws);

      // @issue DTX-6142: past the close frame the counter no longer votes — a pong here does not win a reprieve.
      // @issue DTX-6143: the only thing that defers the terminate, boundedly, is a send buffer still draining.
      if (acc.terminateInTicks !== undefined) {
        if (ws.bufferedAmount === 0 || acc.terminateInTicks <= 0) {
          ws.terminate();
        } else {
          acc.terminateInTicks--;
        }
        continue;
      }

      if (acc.missed >= maxMissedPongs) {
        const silentFor = formatSeconds(acc.missed * intervalMs);
        serverLog.warn(
          `${logPrefix} client went silent for ${acc.missed} pings (~${silentFor}) — closing its connection`,
          { missed: acc.missed },
        );
        // @issue DTX-6144: a close frame first, terminate one tick later — a paused peer can read why its session ended.
        ws.close(4001, `keepalive: no pong within ~${silentFor} — a long pause ends your session`);
        acc.terminateInTicks = maxMissedPongs;
        continue;
      }

      acc.missed++;
      ws.ping();
    }
  }, intervalMs);
  // The server must never be what keeps a process alive after close().
  timer.unref();

  return () => {
    clearInterval(timer);
    wss.off('connection', adopt);
  };
}

/** `12s`, not `0s`: sub-10s windows (tests, aggressive configs) keep a decimal. */
function formatSeconds(ms: number): string {
  const sec = ms / 1000;
  return sec >= 10 ? `${Math.round(sec)}s` : `${Number(sec.toFixed(1))}s`;
}
