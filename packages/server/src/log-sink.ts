/**
 * The server's stdout voice (spec 012): one prose line per event, behind
 * `--log-level`, in a fixed `<iso-timestamp> [<level>] <message>` prefix the
 * accept helper parses (`specs/helpers/session-log.ts`). Every line the
 * server package used to `console.*` goes through here instead; the JSONL
 * sink is always `debug` and lives in `LogStore` / `ConnectionLog`.
 *
 * Server-rank events with no connection to belong to (`DevicePool`'s
 * inventory and evictions, the gateway's refusals, the blob store) are
 * written to `server.jsonl` through the writer `LogStore` attaches here, so
 * a module that knows nothing about connections still leaves a trace.
 */
export const LOG_LEVELS = ['error', 'warn', 'info', 'debug'] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

export function isLogLevel(value: unknown): value is LogLevel {
  return typeof value === 'string' && (LOG_LEVELS as readonly string[]).includes(value);
}

/** Lower is louder: `error` = 0 … `debug` = 3. */
export function levelRank(level: LogLevel): number {
  return LOG_LEVELS.indexOf(level);
}

/** Whether a line at `level` passes a sink whose threshold is `threshold`. */
export function passesLevel(level: LogLevel, threshold: LogLevel): boolean {
  return levelRank(level) <= levelRank(threshold);
}

export const DEFAULT_STDOUT_LEVEL: LogLevel = 'info';

/** The fixed prefix, spelled once: `2026-08-27T10:00:00.000Z [info] …`. */
export function formatStdoutLine(ts: number, level: LogLevel, message: string): string {
  return `${new Date(ts).toISOString()} [${level}] ${message}\n`;
}

/** The parse of {@link formatStdoutLine}, for helpers and tests. */
export const STDOUT_LINE_RE = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z) \[(error|warn|info|debug)\] (.*)$/;

export type ServerFileWriter = (level: LogLevel, message: string, fields?: Record<string, unknown>) => void;

export interface ServerLogSink {
  /** Sets the stdout threshold (`--log-level`). */
  setLevel(level: LogLevel): void;
  readonly level: LogLevel;
  /** Attaches (or detaches, with `undefined`) the `server.jsonl` writer. */
  attachServerFile(writer: ServerFileWriter | undefined): void;
  /** Stdout only — for a line whose JSONL copy is written elsewhere (a connection's own file). */
  echo(level: LogLevel, message: string, ts?: number): void;
  /** A server-rank event: stdout at threshold, plus `server.jsonl` when attached. */
  error(message: string, fields?: Record<string, unknown>): void;
  warn(message: string, fields?: Record<string, unknown>): void;
  info(message: string, fields?: Record<string, unknown>): void;
  debug(message: string, fields?: Record<string, unknown>): void;
}

export function createServerLogSink(write: (chunk: string) => void = (chunk) => void process.stdout.write(chunk)): ServerLogSink {
  let threshold: LogLevel = DEFAULT_STDOUT_LEVEL;
  let serverFile: ServerFileWriter | undefined;
  const echo = (level: LogLevel, message: string, ts = Date.now()): void => {
    if (passesLevel(level, threshold)) write(formatStdoutLine(ts, level, message));
  };
  const emit = (level: LogLevel, message: string, fields?: Record<string, unknown>): void => {
    serverFile?.(level, message, fields);
    echo(level, message);
  };
  return {
    setLevel: (level) => {
      threshold = level;
    },
    get level() {
      return threshold;
    },
    attachServerFile: (writer) => {
      serverFile = writer;
    },
    echo,
    error: (message, fields) => emit('error', message, fields),
    warn: (message, fields) => emit('warn', message, fields),
    info: (message, fields) => emit('info', message, fields),
    debug: (message, fields) => emit('debug', message, fields),
  };
}

/**
 * The process-wide sink. A singleton on purpose: the modules that speak
 * through it (`DevicePool`, `AppGateway`, `BlobStore`, `keepalive`) have no
 * server handle to be given one, and a process has one stdout.
 */
export const serverLog: ServerLogSink = createServerLogSink();

/** `util.inspect`-free rendering of a thrown value for a log line. */
export function describeError(err: unknown): string {
  if (err instanceof Error) return err.stack ?? `${err.name}: ${err.message}`;
  return String(err);
}
