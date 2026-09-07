/**
 * The request scope (spec 013): which request the code running right now
 * serves, carried by `AsyncLocalStorage` from the peer's handler call down
 * to wherever a child process is spawned or a late line is written — so
 * `exec.ts` can record a `simctl` under the `allocateDevice` that ran it
 * without the request being threaded through every signature, and a
 * derived signal (`AbortSignal.any`) never loses the attribution the way a
 * signal-keyed lookup would.
 *
 * The recorder mints one {@link RequestTrace} per request and runs the
 * handler inside it (`Peer`'s `handlerScope`); code with no request in
 * hand — the startup inventory, a reclaim after the socket died — finds
 * no store and falls back to the server-rank trace, whose lines go to
 * `server.jsonl` through the process-wide sink.
 */
import { AsyncLocalStorage } from 'node:async_hooks';
import path from 'node:path';

import { serverLog, type LogLevel } from './log-sink';

export interface SpawnBegin {
  /** `simctl`, `applesimutils`, `ditto`, … — see {@link toolNameOf}. */
  tool: string;
  /** `[file, ...args]` verbatim — never a shell string. */
  argv: readonly string[];
  /** 1 for the first try; each retry is its own child. */
  attempt: number;
}

export interface SpawnEnd {
  ok: boolean;
  exitCode?: number;
  /** The signal that killed it (a timeout's `SIGTERM`), when one did. */
  signal?: string;
  /** A failure to spawn at all (`ENOENT`), or the error for a child with neither an exit code nor a signal. */
  error?: { name: string; message: string };
  stdout: string;
  stderr: string;
}

export interface SpawnSpan {
  end(outcome: SpawnEnd): void;
}

/** What a request offers the code it runs: a child's begin/end and a line under the request's own node. */
export interface RequestTrace {
  beginSpawn(info: SpawnBegin): SpawnSpan;
  /** A line under the request's node — valid after the request ended too (the app's own output arrives later). */
  line(level: LogLevel, msg: string, fields?: Record<string, unknown>): void;
}

export const requestScope = new AsyncLocalStorage<RequestTrace>();

/** The request the caller serves, if any. */
export function currentRequestTrace(): RequestTrace | undefined {
  return requestScope.getStore();
}

/** `xcrun simctl …` is a `simctl` child; anything else is named by its basename. */
export function toolNameOf(file: string, args: readonly string[]): string {
  const base = path.basename(file);
  return base === 'xcrun' && typeof args[0] === 'string' && args[0].length > 0 && !args[0].startsWith('-') ? args[0] : base;
}

/** The last lines of a stream, for a server-rank failure's one warn line. */
function tailOf(text: string, lines = 10): string {
  return text.split('\n').filter((line) => line.length > 0).slice(-lines).join('\n');
}

/**
 * The trace for a spawn with no request behind it: begin/end as `debug`
 * lines in `server.jsonl` (the sink attaches that file), a failure at
 * `warn` with the stderr tail — the startup inventory and the pool's own
 * reconciliation leave a trace without a connection to hang it under.
 */
export const serverRankTrace: RequestTrace = {
  beginSpawn({ tool, argv, attempt }) {
    const startedAt = Date.now();
    serverLog.debug(`spawn ${tool}`, { op: tool, argv, attempt });
    return {
      end({ ok, exitCode, signal, error, stderr }) {
        const durationMs = Date.now() - startedAt;
        const fields = {
          op: tool,
          ok,
          ...(exitCode !== undefined ? { exitCode } : {}),
          ...(signal !== undefined ? { signal } : {}),
          ...(error !== undefined ? { error } : {}),
          durationMs,
          attempt,
        };
        if (ok) serverLog.debug(`${tool} ended after ${String(durationMs)}ms`, fields);
        else serverLog.warn(`${tool} failed after ${String(durationMs)}ms${stderr.trim() ? `: ${tailOf(stderr)}` : ''}`, fields);
      },
    };
  },
  line(level, msg, fields) {
    serverLog[level](msg, fields);
  },
};

/** The current request's trace, else the server-rank one — never nothing. */
export function spawnTrace(): RequestTrace {
  return currentRequestTrace() ?? serverRankTrace;
}
