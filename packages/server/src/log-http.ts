/**
 * The fetch surface of the connection log (spec 012), on the existing
 * tester port, bearer-checked by the same `isAuthorized` as the command
 * channel and the blob lane:
 *
 *   GET /v1/runs
 *       -> application/json: [{ runId, startedAt, endedAt?, bytes, lastSeq, openHandlers }]
 *   GET /v1/runs/<id>/log?after=<seq>&level=<level>&follow=1
 *       -> application/x-ndjson, chunked; `follow` keeps the response open
 *          until the connection's final line
 *   GET /v1/runs/<id>/trace              (spec 012a)
 *       -> application/json, the Perfetto projection of the whole file as
 *          of now (never `follow`: a trace wants its `end`s); the log's gate
 *   GET /v1/runs/<id>/perfetto           (spec 012a)
 *       -> text/html, the viewer page, for ANY well-formed id, WITHOUT the
 *          bearer: it carries nothing but the id it was asked for, and
 *          answers for unknown ids too, so it is not an oracle. The
 *          invariant it depends on, binding on every later spec: no cookie
 *          or other ambient credential may ever gate
 *          `/v1/runs/*` — the page is same-origin with the gated routes.
 *
 * Unknown query parameters are ignored; malformed known ones are 400; an
 * unknown id is 404; anything else under the prefix is 404 too. A slow
 * reader stalls only its own socket (Node's write/drain), never the writer.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';

import { parseTraceLines, renderPerfettoViewer, toChromeTrace } from '@detox-remote/perfetto';

import { isAuthorized, type AuthConfig } from './auth';
import { refuse } from './blob-http';
import { isLogLevel } from './log-sink';
import type { LogStore, ReadOptions } from './LogStore';

export const RUNS_PREFIX = '/v1/runs';

/** `runId`s are server-minted UUIDs; anything else is not a path this route names. */
const CONNECTION_ID_RE = /^[A-Za-z0-9._-]{1,128}$/;

export function isConnectionLogRequest(req: IncomingMessage): boolean {
  const url = req.url ?? '';
  return url === RUNS_PREFIX || url.startsWith(`${RUNS_PREFIX}?`) || url.startsWith(`${RUNS_PREFIX}/`);
}

export interface ConnectionLogDeps {
  store: LogStore;
  auth?: AuthConfig;
  /** The local hop's process name in the trace: `server` on the server, `relay` on the relay (spec 012a). */
  localName: string;
}

/** Never rejects: a reader whose socket died mid-stream has no address to answer. */
export async function handleConnectionLogRequest(
  req: IncomingMessage,
  res: ServerResponse,
  deps: ConnectionLogDeps,
): Promise<void> {
  try {
    await route(req, res, deps);
  } catch {
    if (!res.headersSent) refuse(req, res, 500);
    else res.destroy();
  }
}

async function route(req: IncomingMessage, res: ServerResponse, { store, auth, localName }: ConnectionLogDeps): Promise<void> {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const [, , , id, verb, ...extra] = url.pathname.split('/');

  // The viewer page is the one route under the prefix that is checked
  // before, and without, the bearer: 400 on a malformed id, 404 on any other
  // method — the same refusals as the gated routes, minus the gate.
  if (verb === 'perfetto') {
    if (req.method !== 'GET' || extra.length > 0) return refuse(req, res, 404);
    if (!id || !CONNECTION_ID_RE.test(id)) return refuse(req, res, 400);
    const page = renderPerfettoViewer(id);
    res.writeHead(200, {
      'content-type': 'text/html; charset=utf-8',
      'x-content-type-options': 'nosniff',
      'content-security-policy': page.csp,
      'cache-control': 'no-store',
    });
    res.end(page.html);
    return;
  }

  if (!isAuthorized(req, auth)) return refuse(req, res, 401);
  if (req.method !== 'GET') return refuse(req, res, 404);

  if (url.pathname === RUNS_PREFIX) {
    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(store.index()));
    return;
  }

  if ((verb !== 'log' && verb !== 'trace') || extra.length > 0) return refuse(req, res, 404);
  if (!id || !CONNECTION_ID_RE.test(id)) return refuse(req, res, 400);

  if (verb === 'trace') {
    if (!store.has(id)) return refuse(req, res, 404);
    // Computed per GET from the whole file — parsed, projected, serialized;
    // input is bounded by 012's 64 MiB per-connection cap (cost stated in the spec).
    let jsonl = '';
    for await (const line of store.read(id)) jsonl += line;
    const trace = toChromeTrace(parseTraceLines(jsonl), { runId: id, localName });
    res.writeHead(200, { 'content-type': 'application/json', 'x-content-type-options': 'nosniff', 'cache-control': 'no-store' });
    res.end(JSON.stringify(trace));
    return;
  }

  const options = parseReadOptions(url.searchParams);
  if (!options) return refuse(req, res, 400);
  if (!store.has(id)) return refuse(req, res, 404);

  const abort = new AbortController();
  res.once('close', () => abort.abort());
  res.writeHead(200, { 'content-type': 'application/x-ndjson' });
  res.flushHeaders();
  for await (const line of store.read(id, options, abort.signal)) {
    if (abort.signal.aborted) break;
    if (!res.write(line)) await drained(res, abort.signal);
  }
  res.end();
}

function parseReadOptions(params: URLSearchParams): ReadOptions | undefined {
  const options: ReadOptions = {};
  const after = params.get('after');
  if (after !== null) {
    if (!/^\d{1,15}$/.test(after)) return undefined;
    options.after = Number(after);
  }
  const level = params.get('level');
  if (level !== null) {
    if (!isLogLevel(level)) return undefined;
    options.level = level;
  }
  const follow = params.get('follow');
  if (follow !== null) {
    if (!['1', '0', 'true', 'false'].includes(follow)) return undefined;
    options.follow = follow === '1' || follow === 'true';
  }
  return options;
}

function drained(res: ServerResponse, signal: AbortSignal): Promise<void> {
  return new Promise<void>((resolve) => {
    const done = (): void => {
      res.off('drain', done);
      signal.removeEventListener('abort', done);
      resolve();
    };
    res.once('drain', done);
    signal.addEventListener('abort', done, { once: true });
  });
}
