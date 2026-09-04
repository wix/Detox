/**
 * One connection's JSONL file (spec 012): synchronous append on an open
 * descriptor, a 1-based contiguous `seq`, and the fixed 64 MiB per-connection
 * cap. No logging dependency — the sink is `node:fs`.
 *
 * Durability is the point: a line is on disk (in the kernel's buffer, at
 * least) before the frame it describes is sent, so a crash leaves at most
 * one partial line, which the next server trims.
 */
import { EventEmitter } from 'node:events';
import { closeSync, fstatSync, openSync, writeSync } from 'node:fs';

import type { LogLevel } from './log-sink';

export type LogLineKind = 'begin' | 'end' | 'log';
export type LogNodeType = 'rpc' | 'step' | 'server';

export interface LogNode {
  id: string;
  type: LogNodeType;
  name: string;
  parent?: string;
}

export interface LogLine {
  seq: number;
  ts: number;
  level: LogLevel;
  kind: LogLineKind;
  node: LogNode;
  msg?: string;
  fields?: Record<string, unknown>;
}

export type LogLineInput = Omit<LogLine, 'seq' | 'ts'>;

/** A constant, not a knob (spec 012): reopen if anyone hits it. */
export const CONNECTION_CAP_BYTES = 64 * 1024 * 1024;

interface ConnectionLogInit {
  file: string;
  fd: number;
  lastSeq: number;
  bytes: number;
  capBytes: number;
}

export interface ConnectionLogOpenOptions {
  /** The last `seq` already in the file (0 for a fresh one). */
  lastSeq?: number;
  /** @internal test seam over {@link CONNECTION_CAP_BYTES}. */
  capBytes?: number;
}

export class ConnectionLog extends EventEmitter {
  readonly file: string;
  readonly #fd: number;
  readonly #capBytes: number;
  #seq: number;
  #bytes: number;
  #exhausted = false;
  #broken = false;
  #closed = false;

  private constructor(init: ConnectionLogInit) {
    super();
    this.file = init.file;
    this.#fd = init.fd;
    this.#seq = init.lastSeq;
    this.#bytes = init.bytes;
    this.#capBytes = init.capBytes;
  }

  /** Opens `file` for appending. */
  static open(file: string, options: ConnectionLogOpenOptions = {}): ConnectionLog {
    const fd = openSync(file, 'a');
    return new ConnectionLog({
      file,
      fd,
      lastSeq: options.lastSeq ?? 0,
      bytes: fstatSync(fd).size,
      capBytes: options.capBytes ?? CONNECTION_CAP_BYTES,
    });
  }

  get lastSeq(): number {
    return this.#seq;
  }

  get bytes(): number {
    return this.#bytes;
  }

  /** Past the cap: further lines are dropped (no `seq` consumed) until the final `end`. */
  get exhausted(): boolean {
    return this.#exhausted;
  }

  get closed(): boolean {
    return this.#closed;
  }

  /**
   * Appends one line synchronously. Returns the line as written, or
   * `undefined` when the cap dropped it. `force` is for the connection's own
   * final `end`, which is written even past the cap. `ts` lets a caller
   * merging another hop's own line preserve that hop's wall clock (spec 008:
   * `seq` is this file's own arrival order, `ts` is never reassigned across
   * hops) — omitted, it defaults to now.
   */
  append(input: LogLineInput, force = false, ts?: number): LogLine | undefined {
    if (this.#closed || this.#broken) return undefined;
    if (this.#exhausted && !force) return undefined;
    if (!this.#exhausted && this.#bytes >= this.#capBytes && !force) {
      this.#exhausted = true;
      this.#write({
        level: 'warn',
        kind: 'log',
        node: { id: 'conn', type: 'server', name: 'connection' },
        msg: 'connection log cap reached — further lines are dropped until the connection ends',
        fields: { budget: 'exhausted' },
      });
      return undefined;
    }
    return this.#write(input, ts);
  }

  #write(input: LogLineInput, ts = Date.now()): LogLine | undefined {
    const line: LogLine = { seq: this.#seq + 1, ts, ...input };
    const text = `${JSON.stringify(line)}\n`;
    try {
      writeSync(this.#fd, text);
    } catch {
      // A full disk (ENOSPC) or a failing device must not crash the shared
      // server — and the error path must never write to the same failing
      // descriptor, which would recurse straight back into the same
      // failure. Mark the log broken and stop; the bytes already on disk
      // still read, which is exactly the spec's full-disk promise. `seq` is
      // not advanced, so a partial line consumes no cursor.
      this.#broken = true;
      return undefined;
    }
    this.#seq = line.seq;
    this.#bytes += Buffer.byteLength(text);
    this.emit('append', line);
    return line;
  }

  close(): void {
    if (this.#closed) return;
    this.#closed = true;
    closeSync(this.#fd);
    this.emit('close');
  }
}
