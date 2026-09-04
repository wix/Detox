/**
 * A node's connection log, followed live (spec 008): the relay dials
 * `GET /v1/runs/<id>/log?follow=1` on a node the moment its own
 * `$/serverInfo` names a log, and keeps that stream open for the node
 * connection's whole life — not a poll, not a pull at the end. One dial
 * attempt is {@link NodeLogDialer.dial}; {@link followNodeLog} is the retry
 * loop around it: a drop while the node is still alive (`isAlive()`) resumes
 * at `after=<last seq>` (012's cursor, no gap and no duplicate), a drop once
 * the node is gone is one `warn` line and done. The node's own graceful
 * shutdown ends the stream naturally (its `follow` closes on its own final
 * `conn` end), so the common case never even reaches the retry branch.
 */
import { request as httpRequest, type RequestOptions } from 'node:http';
import { request as httpsRequest } from 'node:https';

import { isLogLevel, type LogLine } from '@detox-remote/server';

/**
 * A wedge, not a patience limit: a drop while the node is presumed alive is
 * retried, not abandoned — only genuine node death (below) stops the
 * follow. Small and fixed: retries here are rare (the node's command socket
 * and its log-follow socket usually die together), this only guards the
 * sliver where they do not.
 */
const RETRY_DELAY_MS = 250;

export interface NodeLogDialer {
  /**
   * One GET attempt. Resolves once the node's own stream ends naturally
   * (its final `conn` end); rejects on any transport failure. Calls
   * `onRawLine` for every complete NDJSON line, in arrival order, before
   * settling.
   */
  dial(
    after: number | undefined,
    signal: AbortSignal | undefined,
    onRawLine: (text: string) => void,
  ): Promise<void>;
}

export interface FollowNodeLogOptions {
  dialer: NodeLogDialer;
  nodeName: string;
  /** Whether the relay still believes the node's command socket is up. */
  isAlive: () => boolean;
  onLine: (line: LogLine) => void;
  /** The node is gone — the caller says so however it needs to (spec 008: one `warn` line on the relay's own `conn`). */
  onNodeGone: (nodeName: string) => void;
  /** Relay-process-lifetime signal — a hard stop, never fired by a client session ending on its own. */
  signal?: AbortSignal;
}

function isWellFormedNode(node: unknown): node is LogLine['node'] {
  if (typeof node !== 'object' || node === null) return false;
  const { id, type, name, parent } = node as Partial<LogLine['node']>;
  return (
    typeof id === 'string' &&
    typeof type === 'string' &&
    typeof name === 'string' &&
    (parent === undefined || typeof parent === 'string')
  );
}

function parseForeignLine(text: string): LogLine | undefined {
  try {
    const parsed = JSON.parse(text) as Partial<LogLine>;
    if (typeof parsed.seq !== 'number' || !isLogLevel(parsed.level) || !isWellFormedNode(parsed.node)) {
      return undefined;
    }
    return parsed as LogLine;
  } catch {
    // A malformed line from a hostile or foreign-version node is skipped,
    // never crashes the follow — the rest of the stream still matters.
    return undefined;
  }
}

/**
 * Runs one node connection's follow to completion. Resolves once there is
 * nothing more to follow: either the node's own stream ended naturally, or
 * the node is gone and one `warn` line has said so.
 */
export async function followNodeLog({
  dialer,
  nodeName,
  isAlive,
  onLine,
  onNodeGone,
  signal,
}: FollowNodeLogOptions): Promise<void> {
  let after: number | undefined;
  for (;;) {
    if (signal?.aborted) return;
    try {
      await dialer.dial(after, signal, (text) => {
        const line = parseForeignLine(text);
        if (line === undefined) return;
        after = line.seq;
        onLine(line);
      });
      return; // the node's own follow closed on its own final `conn` end
    } catch {
      if (signal?.aborted) return;
      if (!isAlive()) {
        onNodeGone(nodeName);
        return;
      }
      await delay(RETRY_DELAY_MS);
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** `ws(s)://` → `http(s)://` — the log lane is plain HTTP under the same host:port as the node's command channel. */
function toHttpOrigin(nodeUrl: string): URL {
  const url = new URL(nodeUrl);
  url.protocol = url.protocol === 'wss:' ? 'https:' : 'http:';
  return url;
}

/**
 * The real dialer: a plain HTTP(S) GET against the node's own port, the same
 * shape as the accept suite's `dialConnectionLog` follow
 * (`specs/helpers/session-log.ts`), productionized with the retry loop
 * above. The node's own token travels here — the client's is never read.
 */
export function createNodeLogDialer(
  nodeUrl: string,
  token: string | undefined,
  nodeRunId: string,
): NodeLogDialer {
  const origin = toHttpOrigin(nodeUrl);
  const request = origin.protocol === 'https:' ? httpsRequest : httpRequest;
  const headers: Record<string, string> = token !== undefined ? { Authorization: `Bearer ${token}` } : {};

  return {
    dial(after, signal, onRawLine) {
      return new Promise<void>((resolve, reject) => {
        const search = new URLSearchParams({
          follow: '1',
          ...(after !== undefined ? { after: String(after) } : {}),
        });
        const options: RequestOptions = {
          hostname: origin.hostname,
          port: origin.port,
          path: `/v1/runs/${encodeURIComponent(nodeRunId)}/log?${search.toString()}`,
          method: 'GET',
          headers,
          signal,
        };
        const req = request(options, (res) => {
          if (res.statusCode !== 200) {
            res.resume();
            reject(new Error(`node log follow answered HTTP ${String(res.statusCode)}`));
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
              if (text.trim()) onRawLine(text);
            }
          });
          res.once('end', () => resolve());
          res.once('error', reject);
        });
        req.once('error', reject);
        req.end();
      });
    },
  };
}
