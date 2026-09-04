/**
 * The two GETs `detox logs` makes (spec 012's fetch surface): the index
 * and a run's JSONL (optionally followed). Every failure is a typed
 * refusal naming what was tried — the server, the id — never a stack.
 */
import { UsageError } from './errors';
import type { LogsServer } from './logs-server';

/** One row of `GET /v1/runs`. */
export interface RunIndexRow {
  runId: string;
  startedAt: string;
  endedAt?: string;
  bytes: number;
  lastSeq: number;
  openHandlers: number;
}

function isRunIndexRow(value: unknown): value is RunIndexRow {
  if (typeof value !== 'object' || value === null) return false;
  const row = value as Partial<RunIndexRow>;
  return typeof row.runId === 'string' && typeof row.startedAt === 'string' && typeof row.lastSeq === 'number';
}

export interface LogFetchOptions {
  follow?: boolean;
  /** Each chunk as it arrives (the `--follow` stream); the whole text is still returned. */
  onChunk?: (text: string) => void;
}

export interface LogsHttp {
  index(): Promise<RunIndexRow[]>;
  log(runId: string, options?: LogFetchOptions): Promise<string>;
}

/** The slice of `fetch`'s init these GETs use. */
interface FetchInit {
  headers?: Record<string, string>;
}

type FetchLike = (input: string, init?: FetchInit) => Promise<Response>;

function headersOf(server: LogsServer): Record<string, string> {
  return server.token !== undefined ? { Authorization: `Bearer ${server.token}` } : {};
}

function hostOf(server: LogsServer): string {
  return new URL(server.httpOrigin).host;
}

export function createLogsHttp(server: LogsServer, fetchImpl: FetchLike = (input, init) => fetch(input, init)): LogsHttp {
  const get = async (path: string): Promise<Response> => {
    let response: Response;
    try {
      response = await fetchImpl(`${server.httpOrigin}${path}`, { headers: headersOf(server) });
    } catch (err) {
      const cause = err instanceof Error ? (err.cause instanceof Error ? err.cause.message : err.message) : String(err);
      throw new UsageError(`detox logs: could not reach ${hostOf(server)} (${server.source === 'helper' ? 'the local helper' : 'client.server'}): ${cause}`);
    }
    if (response.status === 401) throw new UsageError(`detox logs: ${hostOf(server)} rejected the token — set client.token to the server's`);
    return response;
  };
  return {
    async index() {
      const response = await get('/v1/runs');
      if (!response.ok) throw new UsageError(`detox logs: ${hostOf(server)} answered ${String(response.status)} for /v1/runs`);
      const rows: unknown = await response.json();
      // Typed or nothing: a row the server did not shape as one is skipped, never printed as `undefined`.
      return Array.isArray(rows) ? rows.filter(isRunIndexRow) : [];
    },
    async log(runId, options = {}) {
      const id = encodeURIComponent(runId);
      const response = await get(`/v1/runs/${id}/log${options.follow ? '?follow=1' : ''}`);
      if (response.status === 404) throw new UsageError(`detox logs: no run ${runId} on ${hostOf(server)} — the id is wrong, or retention swept it`);
      if (response.status === 400) throw new UsageError(`detox logs: ${runId} is not a run id`);
      if (!response.ok) throw new UsageError(`detox logs: ${hostOf(server)} answered ${String(response.status)} for run ${runId}`);
      if (options.onChunk === undefined || response.body === null) return response.text();
      const decoder = new TextDecoder();
      const parts: string[] = [];
      const reader = response.body.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        parts.push(text);
        options.onChunk(text);
      }
      const tail = decoder.decode();
      if (tail.length > 0) {
        parts.push(tail);
        options.onChunk(tail);
      }
      return parts.join('');
    },
  };
}
