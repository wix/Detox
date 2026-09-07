/**
 * The log root (spec 012): one JSONL file per connection under
 * `<root>/connections/<runId>.jsonl`, `server.jsonl` for server-rank
 * events with no connection, a kernel-held UNIX socket (`.lock.sock`) that
 * makes the root one server's for its life, and the file-is-the-index
 * bookkeeping: `lastSeq` and `endedAt` come from tailing each file once at
 * startup and from the writer thereafter; there is no sidecar to corrupt.
 *
 * Retention is time first (`--log-retention`, counted from `endedAt`), size
 * as a seatbelt (`--log-budget`); both sweeps are lazy — on startup, when a
 * connection opens, and on any fetch of the index — never a timer.
 */
import { createServer as createNetServer, connect as netConnect, type Server as NetServer } from 'node:net';
import {
  closeSync,
  existsSync,
  fstatSync,
  ftruncateSync,
  mkdirSync,
  openSync,
  readSync,
  readdirSync,
  renameSync,
  statSync,
  unlinkSync,
  writeSync,
} from 'node:fs';
import { homedir } from 'node:os';
import * as path from 'node:path';

import { DetoxError, DetoxErrorCode } from '@detox-remote/core';

import { ConnectionLog, CONNECTION_CAP_BYTES, type LogLine } from './ConnectionLog';
import { isLogLevel, passesLevel, serverLog, type LogLevel, type ServerLogSink } from './log-sink';

export const DEFAULT_LOG_ROOT = path.join(homedir(), 'Library', 'Logs', 'detox-server');
/** The build cache's number: normal operation never reaches it. */
export const DEFAULT_LOG_BUDGET_BYTES = 8 * 1024 * 1024 * 1024;
/** A node forgets in minutes: CI pulls the log right after the run. */
export const DEFAULT_NODE_RETENTION_MS = 10 * 60 * 1000;
/** The developer's own disk, and no CI collects on their behalf. */
export const DEFAULT_LOCAL_HELPER_RETENTION_MS = 24 * 60 * 60 * 1000;

const SERVER_FILE = 'server.jsonl';
const SERVER_FILE_GENERATIONS = 3;
const LOCK_SOCKET = '.lock.sock';
const RUNS_DIR = 'runs';
const FILE_SUFFIX = '.jsonl';
/** How much of a file's tail is read to find its last complete line at startup. */
const TAIL_BYTES = 1024 * 1024;
const READ_CHUNK = 64 * 1024;

export const CONN_NODE = { id: 'conn', type: 'server', name: 'connection' } as const;

export interface LogStoreOptions {
  /** The log-root @internal seam; production uses {@link DEFAULT_LOG_ROOT}. */
  root?: string;
  retentionMs?: number;
  budgetBytes?: number;
  /** Test seam: the sink `server.jsonl` echoes through. */
  sink?: ServerLogSink;
  /** @internal test seam over the fixed 64 MiB per-file cap (connections and `server.jsonl` alike). */
  capBytes?: number;
}

/** One row of `GET /v1/runs`. */
export interface ConnectionIndexRow {
  runId: string;
  startedAt: string;
  endedAt?: string;
  bytes: number;
  lastSeq: number;
  openHandlers: number;
}

export interface LiveConnection {
  log: ConnectionLog;
  openHandlers: () => number;
}

interface StoredConnection {
  runId: string;
  file: string;
  startedAt: number;
  endedAt?: number;
  bytes: number;
  lastSeq: number;
  live?: LiveConnection;
}

export interface ReadOptions {
  after?: number;
  level?: LogLevel;
  follow?: boolean;
}

export class LogStore {
  readonly root: string;
  readonly retentionMs: number;
  readonly budgetBytes: number;
  readonly #capBytes: number;
  readonly #sink: ServerLogSink;
  readonly #rows = new Map<string, StoredConnection>();
  #lock: NetServer | undefined;
  #serverFd: number | undefined;
  #serverSeq = 0;
  #serverBytes = 0;
  #closed = false;

  private constructor(options: Required<LogStoreOptions>) {
    this.root = options.root;
    this.retentionMs = options.retentionMs;
    this.budgetBytes = options.budgetBytes;
    this.#capBytes = options.capBytes;
    this.#sink = options.sink;
  }

  /**
   * Opens the root: takes the lock (or refuses typed), trims every file to
   * its last newline, closes the connections a dead server left open, builds
   * the index, sweeps. Synchronous filesystem work by design — the server
   * is not listening yet, and nothing else is racing it for the root.
   */
  static async open(options: LogStoreOptions = {}): Promise<LogStore> {
    const store = new LogStore({
      root: options.root ?? DEFAULT_LOG_ROOT,
      retentionMs: options.retentionMs ?? DEFAULT_NODE_RETENTION_MS,
      budgetBytes: options.budgetBytes ?? DEFAULT_LOG_BUDGET_BYTES,
      sink: options.sink ?? serverLog,
      capBytes: options.capBytes ?? CONNECTION_CAP_BYTES,
    });
    mkdirSync(store.#connectionsDir(), { recursive: true });
    store.#lock = await acquireLock(path.join(store.root, LOCK_SOCKET), store.root);
    store.#openServerFile();
    store.#recover();
    store.#sink.attachServerFile((level, message, fields) => store.#writeServerLine(level, message, fields));
    store.sweep();
    return store;
  }

  #connectionsDir(): string {
    return path.join(this.root, RUNS_DIR);
  }

  #fileOf(runId: string): string {
    return path.join(this.#connectionsDir(), `${runId}${FILE_SUFFIX}`);
  }

  // ── startup recovery ─────────────────────────────────────────────────────

  #recover(): void {
    for (const name of readdirSync(this.#connectionsDir())) {
      if (!name.endsWith(FILE_SUFFIX)) continue;
      const runId = name.slice(0, -FILE_SUFFIX.length);
      const file = path.join(this.#connectionsDir(), name);
      const recovered = recoverFile(file);
      if (!recovered) {
        // Nothing complete survived: not a connection anyone can read.
        try {
          unlinkSync(file);
        } catch {
          /* already gone */
        }
        continue;
      }
      let { lastSeq, endedAt, bytes } = recovered;
      if (endedAt === undefined) {
        const log = ConnectionLog.open(file, { lastSeq, capBytes: this.#capBytes });
        const line = log.append(
          {
            level: 'info',
            kind: 'end',
            node: { ...CONN_NODE },
            msg: 'connection closed by a server restart',
            fields: { ok: false, reason: 'server-restarted' },
          },
          true,
        );
        log.close();
        lastSeq = line?.seq ?? lastSeq;
        endedAt = line?.ts ?? Date.now();
        bytes = statSync(file).size;
      }
      this.#rows.set(runId, { runId, file, startedAt: recovered.startedAt, endedAt, bytes, lastSeq });
    }
  }

  // ── connections ──────────────────────────────────────────────────────────

  /** Opens a fresh file for a connection that just arrived; sweeps first. */
  openConnection(runId: string, openHandlers: () => number): ConnectionLog {
    this.sweep();
    const file = this.#fileOf(runId);
    const log = ConnectionLog.open(file, { capBytes: this.#capBytes });
    this.#rows.set(runId, {
      runId,
      file,
      startedAt: Date.now(),
      bytes: 0,
      lastSeq: 0,
      live: { log, openHandlers },
    });
    return log;
  }

  /** The connection's final line has been written: freeze the row and release the descriptor. */
  endConnection(runId: string): void {
    const row = this.#rows.get(runId);
    if (!row?.live) return;
    row.endedAt = Date.now();
    row.bytes = row.live.log.bytes;
    row.lastSeq = row.live.log.lastSeq;
    const { log } = row.live;
    row.live = undefined;
    log.close();
  }

  has(runId: string): boolean {
    return this.#rows.has(runId);
  }

  /** Whether the connection is still being written (a `follow` stays open). */
  isLive(runId: string): boolean {
    return this.#rows.get(runId)?.live !== undefined;
  }

  index(): ConnectionIndexRow[] {
    this.sweep();
    return [...this.#rows.values()]
      .sort((a, b) => a.startedAt - b.startedAt)
      .map((row) => ({
        runId: row.runId,
        startedAt: new Date(row.startedAt).toISOString(),
        ...(row.endedAt !== undefined ? { endedAt: new Date(row.endedAt).toISOString() } : {}),
        bytes: row.live ? row.live.log.bytes : row.bytes,
        lastSeq: row.live ? row.live.log.lastSeq : row.lastSeq,
        openHandlers: row.live ? row.live.openHandlers() : 0,
      }));
  }

  // ── retention ────────────────────────────────────────────────────────────

  /** The lazy sweep: time first, then the byte seatbelt. Live connections are never touched. */
  sweep(): void {
    const now = Date.now();
    for (const row of [...this.#rows.values()]) {
      if (row.live || row.endedAt === undefined) continue;
      if (now - row.endedAt >= this.retentionMs) this.#evict(row);
    }
    const ended = [...this.#rows.values()]
      .filter((row) => !row.live && row.endedAt !== undefined)
      .sort((a, b) => (a.endedAt ?? 0) - (b.endedAt ?? 0));
    let total = ended.reduce((sum, row) => sum + row.bytes, 0);
    for (const row of ended) {
      if (total <= this.budgetBytes) break;
      total -= row.bytes;
      this.#evict(row);
      this.#sink.warn(
        `log budget exceeded — evicted connection ${row.runId} (${String(row.bytes)} bytes); the byte budget, not the clock, did this`,
        { evicted: row.runId, bytes: row.bytes, budget: 'exceeded' },
      );
    }
  }

  #evict(row: StoredConnection): void {
    this.#rows.delete(row.runId);
    try {
      // POSIX unlink: a reader holding the descriptor keeps reading its copy.
      unlinkSync(row.file);
    } catch {
      /* already gone */
    }
  }

  // ── reading ──────────────────────────────────────────────────────────────

  /**
   * Streams the file's lines as raw JSONL text: `seq > after`, at or above
   * `level`, the final `conn` end always. With `follow`, tails the file
   * with the reader's own cursor until the connection ends. The file is the
   * buffer — the writer never learns readers exist.
   */
  async *read(runId: string, options: ReadOptions = {}, signal?: AbortSignal): AsyncGenerator<string> {
    const row = this.#rows.get(runId);
    if (!row) return;
    const after = options.after ?? 0;
    const threshold = options.level ?? 'debug';
    const fd = openSync(row.file, 'r');
    const buffer = Buffer.alloc(READ_CHUNK);
    let offset = 0;
    let carry = '';
    try {
      while (!signal?.aborted) {
        const read = readSync(fd, buffer, 0, buffer.length, offset);
        if (read === 0) {
          if (!options.follow) return;
          const live = row.live;
          if (!live || live.log.closed) return;
          if (live.log.bytes > offset) continue;
          await nextAppendOrClose(live.log, signal);
          continue;
        }
        offset += read;
        carry += buffer.toString('utf8', 0, read);
        let newline = carry.indexOf('\n');
        while (newline !== -1) {
          const text = carry.slice(0, newline);
          carry = carry.slice(newline + 1);
          newline = carry.indexOf('\n');
          const line = parseLine(text);
          if (!line || line.seq <= after) continue;
          if (passesLevel(line.level, threshold) || isConnEnd(line)) yield `${text}\n`;
        }
      }
    } finally {
      closeSync(fd);
    }
  }

  // ── server.jsonl ─────────────────────────────────────────────────────────

  #serverFile(generation = 0): string {
    return path.join(this.root, generation === 0 ? SERVER_FILE : `server.${String(generation)}.jsonl`);
  }

  #openServerFile(): void {
    const file = this.#serverFile();
    const recovered = existsSync(file) ? recoverFile(file) : undefined;
    this.#serverSeq = recovered?.lastSeq ?? 0;
    this.#serverFd = openSync(file, 'a');
    this.#serverBytes = fstatSync(this.#serverFd).size;
  }

  #writeServerLine(level: LogLevel, msg: string, fields?: Record<string, unknown>): void {
    if (this.#serverFd === undefined || this.#closed) return;
    if (this.#serverBytes >= this.#capBytes) this.#rotateServerFile();
    const line: LogLine = {
      seq: ++this.#serverSeq,
      ts: Date.now(),
      level,
      kind: 'log',
      node: { id: 'server', type: 'server', name: 'server' },
      msg,
      ...(fields ? { fields } : {}),
    };
    const text = `${JSON.stringify(line)}\n`;
    writeSync(this.#serverFd, text);
    this.#serverBytes += Buffer.byteLength(text);
  }

  #rotateServerFile(): void {
    if (this.#serverFd !== undefined) closeSync(this.#serverFd);
    for (let generation = SERVER_FILE_GENERATIONS - 1; generation >= 1; generation--) {
      const older = this.#serverFile(generation);
      const newer = this.#serverFile(generation - 1);
      if (generation === SERVER_FILE_GENERATIONS - 1 && existsSync(older)) unlinkSync(older);
      if (existsSync(newer)) renameSync(newer, older);
    }
    this.#serverFd = openSync(this.#serverFile(), 'a');
    this.#serverBytes = 0;
    this.#serverSeq = 0;
  }

  // ── lifetime ─────────────────────────────────────────────────────────────

  async close(): Promise<void> {
    if (this.#closed) return;
    this.#closed = true;
    this.#sink.attachServerFile(undefined);
    for (const row of this.#rows.values()) row.live?.log.close();
    if (this.#serverFd !== undefined) closeSync(this.#serverFd);
    const lock = this.#lock;
    if (lock) await new Promise<void>((resolve) => lock.close(() => resolve()));
  }
}

/** Resolves on the log's next append or its close — whichever comes first — or the signal. */
function nextAppendOrClose(log: ConnectionLog, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve) => {
    const done = (): void => {
      log.off('append', done);
      log.off('close', done);
      signal?.removeEventListener('abort', done);
      resolve();
    };
    log.once('append', done);
    log.once('close', done);
    signal?.addEventListener('abort', done, { once: true });
  });
}

function parseLine(text: string): LogLine | undefined {
  try {
    const parsed = JSON.parse(text) as Partial<LogLine>;
    if (typeof parsed.seq !== 'number' || !isLogLevel(parsed.level)) return undefined;
    return parsed as LogLine;
  } catch {
    return undefined;
  }
}

function isConnEnd(line: LogLine): boolean {
  return line.kind === 'end' && line.node?.id === CONN_NODE.id;
}

interface RecoveredFile {
  startedAt: number;
  lastSeq: number;
  endedAt?: number;
  bytes: number;
}

/**
 * Trims `file` to its last newline and reads its first and last complete
 * lines. `undefined` when no complete line survives.
 */
export function recoverFile(file: string): RecoveredFile | undefined {
  const fd = openSync(file, 'r+');
  try {
    let size = fstatSync(fd).size;
    if (size === 0) return undefined;
    // Grow the tail window until it holds the last COMPLETE line whole, or we
    // have read the entire file. The 1 MiB window is only an optimization: a
    // line can legitimately reach many MiB (step `attrs` are uncapped and ws
    // frames run to 16 MiB), and giving up after one window would unlink a
    // file full of complete lines — the opposite of "every complete line
    // survives". Files are capped at 64 MiB and this runs once per file at
    // startup, so reading more is cheap.
    let window = TAIL_BYTES;
    let lastText: string | undefined;
    let keep = size;
    for (;;) {
      const start = Math.max(0, size - window);
      const buf = Buffer.alloc(size - start);
      readSync(fd, buf, 0, buf.length, start);
      const lastNewline = buf.lastIndexOf(0x0a);
      if (lastNewline === -1) {
        // No line terminates within this window.
        if (start === 0) return undefined;
        window *= 2;
        continue;
      }
      keep = start + lastNewline + 1; // absolute, stable across window growth
      const complete = buf.toString('utf8', 0, lastNewline);
      const prevNewline = complete.lastIndexOf('\n');
      if (prevNewline === -1 && start > 0) {
        // The last complete line begins before the window — grow and retry.
        window *= 2;
        continue;
      }
      lastText = complete.slice(prevNewline + 1);
      break;
    }
    if (keep < size) {
      ftruncateSync(fd, keep);
      size = keep;
    }
    const last = parseLine(lastText);
    if (!last) return undefined;
    // The first line, for `startedAt`. A first line longer than one read chunk
    // is exotic; fall back to the last line's ts rather than grow again.
    const head = Buffer.alloc(Math.min(size, READ_CHUNK));
    readSync(fd, head, 0, head.length, 0);
    const headText = head.toString('utf8');
    const headNewline = headText.indexOf('\n');
    const first = parseLine(headNewline === -1 ? headText : headText.slice(0, headNewline));
    return {
      startedAt: first?.ts ?? last.ts,
      lastSeq: last.seq,
      endedAt: isConnEnd(last) ? last.ts : undefined,
      bytes: size,
    };
  } finally {
    closeSync(fd);
  }
}

/**
 * Binds the lock socket. `EADDRINUSE` with a listener behind it is the
 * typed refusal; a socket file nobody answers on is a dead server's
 * leftover (the kernel released the listener, not the path) and is reused.
 */
async function acquireLock(sockPath: string, root: string): Promise<NetServer> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await listenOn(sockPath);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'EADDRINUSE') throw err;
      if (await someoneListens(sockPath)) {
        throw new DetoxError(`another Detox Server holds the log root ${root} — stop it, or start this one with a different log root`, {
          code: DetoxErrorCode.DETOX_LOG_ROOT_HELD,
          details: { root },
        });
      }
      try {
        unlinkSync(sockPath);
      } catch {
        /* raced away */
      }
    }
  }
  throw new DetoxError(`could not take the log root lock at ${sockPath}`, {
    code: DetoxErrorCode.DETOX_LOG_ROOT_HELD,
    details: { root },
  });
}

function listenOn(sockPath: string): Promise<NetServer> {
  return new Promise<NetServer>((resolve, reject) => {
    const server = createNetServer((socket) => socket.destroy());
    server.once('error', reject);
    server.listen(sockPath, () => {
      server.off('error', reject);
      // The lock must never be the reason the process stays alive.
      server.unref();
      resolve(server);
    });
  });
}

function someoneListens(sockPath: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const socket = netConnect(sockPath);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => resolve(false));
  });
}
