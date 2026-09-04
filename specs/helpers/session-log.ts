/**
 * Raw HTTP client for the connection log (spec 012) — the `blob-lane.ts`
 * tradition: the fetch surface is a public wire contract (the relay and CI
 * both read it), so the accept suite reads it with node's own http client,
 * behind the product's back, never through a product API.
 *
 * Also here: the parse of the server's stdout prefix (`stdoutLinesAtLevel`),
 * kept in an editable helper so the accept file pins levels, not prose.
 */
import { request } from 'node:http';

import type { DetoxServerAddress } from 'detox/client';

import { waitUntil } from './simctl';

export type ConnectionLogLevel = 'error' | 'warn' | 'info' | 'debug';
export type ConnectionLogKind = 'begin' | 'end' | 'log';
export type ConnectionLogNodeType = 'rpc' | 'step' | 'server';

/** The typed `fields` vocabulary of spec 012's line shape; unknown keys stay reachable. */
export interface ConnectionLogFields {
  method?: string;
  params?: unknown;
  paramsTruncated?: true;
  op?: string;
  kind?: string;
  attrs?: unknown;
  ok?: boolean;
  durationMs?: number;
  error?: { code?: number; message?: string; name?: string; data?: unknown };
  status?: string;
  reason?: string;
  rejected?: string;
  id?: string;
  budget?: string;
  [key: string]: unknown;
}

export interface ConnectionLogLine {
  seq: number;
  ts: number;
  level: ConnectionLogLevel;
  kind: ConnectionLogKind;
  node: { id: string; type: ConnectionLogNodeType; name: string; parent?: string };
  msg?: string;
  fields?: ConnectionLogFields;
}

export interface ConnectionIndexRow {
  runId: string;
  startedAt: string;
  endedAt?: string;
  bytes: number;
  lastSeq: number;
  openHandlers: number;
}

export interface FetchOptions {
  after?: number;
  level?: ConnectionLogLevel;
}

export interface FetchUntilOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

export interface FollowOptions {
  signal?: AbortSignal;
}

export interface StatusOptions {
  /** Send the real bearer header (default) or none at all (`false`). */
  authorized?: boolean;
  /** The HTTP method (default `GET`); spec 012a pins `POST` refusals on the trace routes. */
  method?: 'GET' | 'POST';
}

/** A raw answer: status, the response headers (lower-cased names), and the body as text (spec 012a). */
export interface RawAnswer {
  status: number;
  headers: Record<string, string | undefined>;
  body: string;
}

/** A settlement probe — see {@link settled}. */
export interface SettledState {
  readonly settled: boolean;
}

export interface FollowStream {
  /** The first line — already received or still to come — that satisfies `predicate`. */
  next(predicate: (line: ConnectionLogLine) => boolean): Promise<ConnectionLogLine>;
  /** A copy of everything received so far, taken the moment `predicate` first holds. */
  snapshotWhen(predicate: (lines: ConnectionLogLine[]) => boolean): Promise<ConnectionLogLine[]>;
  /** Resolves `true` once the server ended the response. */
  closed(): Promise<boolean>;
}

/**
 * `detox.runId` is `string | undefined` on the public type (an
 * endpoint that records no log announces none); the accept suite only ever
 * dials a recording server, so the lane takes the public type and refuses
 * `undefined` at run time rather than making the frozen file narrow it.
 */
export type ConnectionIdArg = string | undefined;

export interface ConnectionLogLane {
  fetch(runId: ConnectionIdArg, options?: FetchOptions): Promise<string>;
  /** Re-fetches until `predicate` holds over the parsed lines — a notification races an HTTP read by design. */
  fetchUntil(
    runId: ConnectionIdArg,
    predicate: (lines: ConnectionLogLine[]) => boolean,
    options: FetchUntilOptions,
  ): Promise<string>;
  index(): Promise<ConnectionIndexRow[]>;
  follow(runId: ConnectionIdArg, options: FollowOptions): FollowStream;
  /** Status code of a raw GET on `path` (the integration checks: 401, 400, 404). */
  status(path: string, options?: StatusOptions): Promise<number>;
  /** A raw GET on `path`, body and headers returned (spec 012a: the trace and the viewer page). */
  get(path: string, options?: StatusOptions): Promise<RawAnswer>;
}

/** The trace the server serves at `GET /v1/runs/<id>/trace` (spec 012a), typed loosely: the accept file compares it against the JSONL. */
export interface TraceEvent {
  name: string;
  cat?: string;
  ph: string;
  ts?: number;
  dur?: number;
  pid: number;
  tid?: number;
  s?: string;
  args?: Record<string, unknown> & { detox?: { id?: string; parent?: string; level?: string } };
}

export interface ChromeTrace {
  traceEvents: TraceEvent[];
  metadata: { runId?: string; title: string; lines: number };
}

export function parseTrace(text: string): ChromeTrace {
  return JSON.parse(text) as ChromeTrace;
}

export function parseNdjson(text: string): ConnectionLogLine[] {
  return text
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as ConnectionLogLine);
}

/** The server's fixed stdout prefix: `<iso> [<level>] <message>`. */
const STDOUT_LINE_RE = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z) \[(error|warn|info|debug)\] (.*)$/;

export interface StdoutLine {
  ts: string;
  level: ConnectionLogLevel;
  message: string;
}

/** Every stdout line the server printed at exactly `level`, parsed by the prefix — never by prose. */
export function stdoutLinesAtLevel(logs: string, level: ConnectionLogLevel): StdoutLine[] {
  const parsed: StdoutLine[] = [];
  for (const raw of logs.split('\n')) {
    // The accept runner prefixes relayed server output; strip it if present.
    const line = raw.replace(/^\[server\] /, '');
    const match = STDOUT_LINE_RE.exec(line);
    if (match && match[2] === level) parsed.push({ ts: match[1], level, message: match[3] });
  }
  return parsed;
}

/** A settlement probe: `.settled` flips the moment the promise resolves or rejects. */
export function settled(promise: Promise<unknown>): SettledState {
  const state = { settled: false };
  promise.then(
    () => {
      state.settled = true;
    },
    () => {
      state.settled = true;
    },
  );
  return state;
}

function requireId(runId: ConnectionIdArg): string {
  if (runId === undefined) throw new Error('this endpoint announced no connection log — no id to fetch');
  return runId;
}

function logPath(runId: string, query: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) if (value !== undefined) params.set(key, value);
  const suffix = params.size > 0 ? `?${params.toString()}` : '';
  return `/v1/runs/${runId}/log${suffix}`;
}

export function dialConnectionLog(address: DetoxServerAddress): ConnectionLogLane {
  const wsUrl = new URL(address.url);
  const host = wsUrl.hostname;
  const port = Number(wsUrl.port);
  const authHeaders: Record<string, string> = { ...address.headers };

  function get(path: string, headers: Record<string, string> = authHeaders, method: 'GET' | 'POST' = 'GET'): Promise<RawAnswer> {
    return new Promise((resolve, reject) => {
      const req = request({ host, port, method, path, headers }, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.once('end', () => {
          const answer: Record<string, string | undefined> = {};
          for (const [name, value] of Object.entries(res.headers)) answer[name] = Array.isArray(value) ? value.join(', ') : value;
          resolve({ status: res.statusCode ?? 0, headers: answer, body: Buffer.concat(chunks).toString('utf8') });
        });
        res.once('error', reject);
      });
      req.once('error', reject);
      req.end();
    });
  }

  async function fetch(id: ConnectionIdArg, options: FetchOptions = {}): Promise<string> {
    const runId = requireId(id);
    const { status, body } = await get(
      logPath(runId, {
        after: options.after === undefined ? undefined : String(options.after),
        level: options.level,
      }),
    );
    if (status !== 200) throw new Error(`GET ${logPath(runId, {})} answered ${String(status)}`);
    return body;
  }

  return {
    fetch,
    async fetchUntil(id, predicate, options) {
      const runId = requireId(id);
      let text = '';
      await waitUntil(
        async () => {
          text = await fetch(runId);
          return predicate(parseNdjson(text));
        },
        { signal: options.signal, timeoutMs: options.timeoutMs ?? 30_000, description: `the log of ${runId} to satisfy the predicate` },
      );
      return text;
    },
    async index() {
      const { status, body } = await get('/v1/runs');
      if (status !== 200) throw new Error(`GET /v1/runs answered ${String(status)}`);
      return JSON.parse(body) as ConnectionIndexRow[];
    },
    async status(path, options) {
      const { status } = await get(path, options?.authorized === false ? {} : authHeaders, options?.method);
      return status;
    },
    get: (path, options) => get(path, options?.authorized === false ? {} : authHeaders, options?.method),
    follow(id, options) {
      const runId = requireId(id);
      const lines: ConnectionLogLine[] = [];
      const waiters: (() => void)[] = [];
      let ended = false;
      let failure: Error | undefined;
      const wake = (): void => {
        for (const waiter of waiters.splice(0)) waiter();
      };
      const req = request(
        { host, port, method: 'GET', path: logPath(runId, { follow: '1' }), headers: authHeaders, signal: options.signal },
        (res) => {
          if (res.statusCode !== 200) {
            failure = new Error(`follow ${runId} answered ${String(res.statusCode)}`);
            ended = true;
            res.resume();
            wake();
            return;
          }
          let carry = '';
          res.setEncoding('utf8');
          res.on('data', (chunk: string) => {
            carry += chunk;
            let newline = carry.indexOf('\n');
            while (newline !== -1) {
              const text = carry.slice(0, newline);
              carry = carry.slice(newline + 1);
              newline = carry.indexOf('\n');
              if (text.trim()) lines.push(JSON.parse(text) as ConnectionLogLine);
            }
            wake();
          });
          res.once('end', () => {
            ended = true;
            wake();
          });
          res.once('error', (err: Error) => {
            failure = err;
            ended = true;
            wake();
          });
        },
      );
      req.once('error', (err: Error) => {
        failure = err;
        ended = true;
        wake();
      });
      req.end();

      const until = <T>(probe: () => T | undefined, what: string): Promise<T> =>
        new Promise<T>((resolve, reject) => {
          const check = (): void => {
            const value = probe();
            if (value !== undefined) return resolve(value);
            if (failure) return reject(failure);
            if (ended) return reject(new Error(`follow of ${runId} ended before ${what}`));
            waiters.push(check);
          };
          check();
        });

      return {
        next: (predicate) => until(() => lines.find(predicate), 'the awaited line arrived'),
        snapshotWhen: (predicate) => until(() => (predicate(lines) ? [...lines] : undefined), 'the snapshot condition held'),
        closed: () =>
          new Promise<boolean>((resolve, reject) => {
            const check = (): void => {
              if (failure) return reject(failure);
              if (ended) return resolve(true);
              waiters.push(check);
            };
            check();
          }),
      };
    },
  };
}
