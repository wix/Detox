/**
 * Which server `detox logs` reads (spec 013): the one `detox test` dials —
 * `client.server` with `client.token` from the config, else the alpha
 * default when `server.autostart` is `false`, else the detached local
 * helper's cookie (a developer's runs live there) — else a typed refusal
 * naming `client.server`. Never a spawn: a reader that starts a server
 * would read an empty one.
 */
import { UsageError } from './errors';
import { resolveRun, type ResolveInput } from './resolve';

export interface LogsServer {
  /** `http://host:port` — the server's HTTP origin, where `/v1/runs` lives. */
  httpOrigin: string;
  /** The bearer, when the server wants one. Never printed. */
  token?: string;
  /** Where the address came from — for the refusal wording. */
  source: 'config' | 'default' | 'helper';
}

export interface ResolveLogsServerInput extends ResolveInput {
  /** The helper's address, if one is alive — injected, so a test needs no cookie on disk. */
  helperAddress: () => Promise<{ url: string } | undefined>;
}

/** `ws://host:port` → `http://host:port` (`wss` → `https`). */
export function httpOriginOf(wsUrl: string): string {
  const url = new URL(wsUrl);
  url.protocol = url.protocol === 'wss:' ? 'https:' : 'http:';
  url.pathname = '/';
  url.search = '';
  url.hash = '';
  return url.origin;
}

/** The alpha default: where a serverless project with `server.autostart: false` points. */
export const DEFAULT_LOCAL_SERVER_URL = 'ws://127.0.0.1:8080';

export async function resolveLogsServer(input: ResolveLogsServerInput): Promise<LogsServer> {
  const resolved = await resolveRun(input);
  const client = resolved.snapshot.client as { server?: unknown; token?: unknown } | undefined;
  const server = typeof client?.server === 'string' && client.server !== '' ? client.server : undefined;
  const token = typeof client?.token === 'string' && client.token !== '' ? client.token : undefined;
  if (server !== undefined) return { httpOrigin: httpOriginOf(server), ...(token !== undefined ? { token } : {}), source: 'config' };
  if (resolved.autostart === false) return { httpOrigin: httpOriginOf(DEFAULT_LOCAL_SERVER_URL), source: 'default' };
  const helper = await input.helperAddress();
  if (helper !== undefined) return { httpOrigin: httpOriginOf(helper.url), source: 'helper' };
  throw new UsageError(
    'detox logs: no server to read from — this project names no client.server, and no local helper is running ' +
      '(`detox test` starts one; a run made elsewhere is read where it was made)',
  );
}
