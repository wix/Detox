/**
 * The app's own stdout/stderr (spec 013): `simctl launch --stdout=<file>
 * --stderr=<file>` writes the launched process's streams to files that
 * must live inside the simulator's own data directory — v20's
 * `LogsInfo.js` recipe: a path anywhere else captures
 * nothing and creates no file, while inside `data/tmp` simctl creates both
 * files itself and streams live. The capture polls them (never a blocking
 * open, never a fifo) for the app's life and hands each line to the
 * launch request's trace as a `debug` line under the launch node:
 * `fields: { stream, pid, line }`. One budget per launch; past it, one
 * `warn` and the tail stops.
 *
 * Polling is a wedge detector's opposite — it is not a clock anyone waits
 * on: a line arrives at most one poll late, and `stop()` drains what
 * is on disk before it returns, so a `terminateApp` answer never precedes
 * the lines the app printed before it died.
 */
import { closeSync, mkdirSync, openSync, readSync, rmSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { StringDecoder } from 'node:string_decoder';

import type { AppOutputSink } from '@detox-remote/server';

export interface AppOutputPaths {
  stdout: string;
  stderr: string;
}

export interface AppOutputCaptureInit {
  paths: AppOutputPaths;
  sink: AppOutputSink;
  /** `--app-output-budget`: bytes of lines stored per launch. */
  budgetBytes: number;
  /** @internal test seam over the poll cadence. */
  pollMs?: number;
}

/** CoreSimulator's per-device data directory, where a launched app may write. */
export const DEFAULT_SIMULATOR_DEVICES_ROOT = path.join(homedir(), 'Library', 'Developer', 'CoreSimulator', 'Devices');

const POLL_MS = 100;
const READ_CHUNK = 64 * 1024;

/** Where a launch's two capture files go: `<devices root>/<udid>/data/tmp/detox-launch-<token>.{out,err}`. */
export function appOutputPaths(devicesRoot: string, udid: string, token: string): AppOutputPaths {
  const dir = path.join(devicesRoot, udid, 'data', 'tmp');
  return { stdout: path.join(dir, `detox-launch-${token}.out`), stderr: path.join(dir, `detox-launch-${token}.err`) };
}

/** The directory must exist before `simctl launch` opens the files there; a device that has one already is left alone. */
export function ensureAppOutputDir(paths: AppOutputPaths): void {
  mkdirSync(path.dirname(paths.stdout), { recursive: true });
}

type Stream = 'stdout' | 'stderr';

interface Tail {
  stream: Stream;
  file: string;
  offset: number;
  /** Bytes → text across reads: a multi-byte character split by a chunk edge or a mid-write poll stays one character. */
  decoder: StringDecoder;
  carry: string;
  lines: number;
}

export class AppOutputCapture {
  readonly #tails: Tail[];
  #pid = 0;
  readonly #sink: AppOutputSink;
  readonly #budgetBytes: number;
  readonly #pollMs: number;
  #bytes = 0;
  #exhausted = false;
  #timer: ReturnType<typeof setInterval> | undefined;
  #stopped = false;

  constructor({ paths, sink, budgetBytes, pollMs = POLL_MS }: AppOutputCaptureInit) {
    this.#tails = [
      { stream: 'stdout', file: paths.stdout, offset: 0, decoder: new StringDecoder('utf8'), carry: '', lines: 0 },
      { stream: 'stderr', file: paths.stderr, offset: 0, decoder: new StringDecoder('utf8'), carry: '', lines: 0 },
    ];
    this.#sink = sink;
    this.#budgetBytes = budgetBytes;
    this.#pollMs = pollMs;
  }

  /** Begins polling for `pid`'s output (the pid simctl reported). A capture already stopped never restarts. */
  start(pid: number): void {
    if (this.#timer !== undefined || this.#stopped) return;
    this.#pid = pid;
    this.#timer = setInterval(() => this.poll(), this.#pollMs);
    // A tail must never be the reason the server cannot exit.
    this.#timer.unref();
  }

  /** Reads whatever the files hold past the last read; synchronous, so a caller can drain on demand. */
  poll(): void {
    if (this.#exhausted) return;
    for (const tail of this.#tails) this.#drain(tail);
  }

  /** Stops polling, drains once more, removes the files. Idempotent. */
  stop(): void {
    if (this.#stopped) return;
    this.#stopped = true;
    if (this.#timer !== undefined) clearInterval(this.#timer);
    this.#timer = undefined;
    this.poll();
    for (const tail of this.#tails) {
      try {
        rmSync(tail.file, { force: true });
      } catch {
        // A file simctl never created, or one already gone: nothing to remove.
      }
    }
  }

  #drain(tail: Tail): void {
    let size: number;
    try {
      size = statSync(tail.file).size;
    } catch {
      return; // not created yet (simctl creates it on launch), or gone
    }
    if (size <= tail.offset) return;
    let fd: number;
    try {
      fd = openSync(tail.file, 'r');
    } catch {
      return;
    }
    try {
      const buffer = Buffer.alloc(READ_CHUNK);
      while (tail.offset < size && !this.#exhausted) {
        const read = readSync(fd, buffer, 0, Math.min(READ_CHUNK, size - tail.offset), tail.offset);
        if (read <= 0) break;
        tail.offset += read;
        tail.carry += tail.decoder.write(buffer.subarray(0, read));
        let newline = tail.carry.indexOf('\n');
        while (newline !== -1 && !this.#exhausted) {
          const text = tail.carry.slice(0, newline).replace(/\r$/, '');
          tail.carry = tail.carry.slice(newline + 1);
          this.#emit(tail, text);
          newline = tail.carry.indexOf('\n');
        }
      }
    } finally {
      closeSync(fd);
    }
  }

  #emit(tail: Tail, text: string): void {
    const cost = Buffer.byteLength(text) + 1;
    if (this.#bytes + cost > this.#budgetBytes) {
      this.#exhausted = true;
      // One warn, and nothing more for this pid: no `stream` (the accept file pins that this is the only line).
      this.#sink.line('warn', 'app output truncated', { pid: this.#pid, budget: 'exhausted' });
      if (this.#timer !== undefined) clearInterval(this.#timer);
      this.#timer = undefined;
      return;
    }
    this.#bytes += cost;
    tail.lines += 1;
    this.#sink.line('debug', text, { stream: tail.stream, pid: this.#pid, line: tail.lines });
  }
}
