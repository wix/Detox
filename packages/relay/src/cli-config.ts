/**
 * Pure argv/env → config resolution for the relay CLI, split from the
 * process shell so units can cover every refusal.
 *
 * Conventions shared with the server CLI: `||`-not-`??` on env vars (a
 * declared-but-empty variable is not a configuration — `Number('')` is 0,
 * which legally means "no liveness polls ever"), the 7-day
 * keepalive ceiling (past ~74 days the derived interval overflows Node's
 * 32-bit timer and setInterval clamps to 1 ms — a ping storm), and tokens
 * through the environment, never argv.
 */
import { networkInterfaces } from 'node:os';

import { KEEPALIVE_OFF, type AuthConfig, type KeepaliveConfig } from '@detox-remote/server';

export class RelayCliError extends Error {}

export interface RelayCliArgs {
  argv: readonly string[];
  env: Readonly<Record<string, string | undefined>>;
  /**
   * True when the caller carries a roster in process (the `detox relay`
   * verb's config-sourced `server.nodes`, spec 009) — the missing-roster
   * refusal is then the caller's concern, and node tokens never touch a
   * temp file.
   */
  hasInlineNodes?: boolean;
}

export interface ResolvedRelayCli {
  port: number;
  host: string;
  /** Absent → the relay's own door is open — auth is opt-in and off. */
  auth?: AuthConfig;
  keepalive: KeepaliveConfig;
  /** Path of the nodes file — reading it is the shell's job. Absent only when the caller declared an inline roster. */
  nodesFile?: string;
  blobBudget?: number;
  blobRoot?: string;
}

/**
 * A flag either has a real value or the invocation is refused — returning
 * the next flag as a value (`--host --port 8099` → host "--port") is a
 * value-swallowing trap; a missing value is an error naming the flag, never
 * a silent misparse.
 */
function getArg(argv: readonly string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  if (i === -1) return undefined;
  const value = argv[i + 1];
  if (value === undefined || value.startsWith('-')) {
    throw new RelayCliError(`Missing value for ${name}`);
  }
  return value;
}

// The window is the contract number a paused client experiences; the ping
// cadence is derived. Operator-only: a client-chosen window would be the
// client dictating the relay's pool policy.
const KEEPALIVE_MISSES = 3;
const KEEPALIVE_WINDOW_MAX_SEC = 604_800;
const DEFAULT_KEEPALIVE_WINDOW_SEC = 120;
const DEFAULT_PORT = 0;

export function resolveRelayCli({ argv, env, hasInlineNodes = false }: RelayCliArgs): ResolvedRelayCli {
  // `--port 0` (the default) = OS-picked; the IPC announce carries the truth.
  const port = Number(getArg(argv, '--port') ?? env.PORT ?? DEFAULT_PORT);
  if (!Number.isInteger(port) || port < 0 || port > 65_535) {
    throw new RelayCliError(`Invalid --port: expected 0-65535, got ${String(port)}`);
  }
  const host = getArg(argv, '--host') || env.DETOX_RELAY_HOST || '127.0.0.1';

  const nodesFile = getArg(argv, '--nodes') || env.DETOX_RELAY_NODES;
  if (!nodesFile && !hasInlineNodes) {
    throw new RelayCliError(
      'Missing a node roster: pass --nodes <file> (or DETOX_RELAY_NODES, or a ' +
        '`server.nodes` list in the detox config) — a relay needs its fleet, a JSON ' +
        'array of { "name", "url", "token"? }. A file, never argv: node tokens are ' +
        'secrets and a command line is readable by every process on the machine.',
    );
  }

  const windowRaw = getArg(argv, '--keepalive-window') || env.DETOX_RELAY_KEEPALIVE_WINDOW;
  const keepaliveWindowSec = Number(windowRaw || DEFAULT_KEEPALIVE_WINDOW_SEC);
  if (
    !Number.isFinite(keepaliveWindowSec) ||
    keepaliveWindowSec < 0 ||
    keepaliveWindowSec > KEEPALIVE_WINDOW_MAX_SEC
  ) {
    throw new RelayCliError(
      `Invalid --keepalive-window: ${String(windowRaw)} — expected seconds between 0 and ` +
        `${String(KEEPALIVE_WINDOW_MAX_SEC)} (7 days); 0 = no liveness polls`,
    );
  }
  // `0` is legal and means off — the same rule as the server's.
  const keepalive: KeepaliveConfig =
    keepaliveWindowSec === 0
      ? KEEPALIVE_OFF
      : {
          intervalMs: (keepaliveWindowSec * 1000) / KEEPALIVE_MISSES,
          maxMissedPongs: KEEPALIVE_MISSES,
        };

  const blobBudgetArg = getArg(argv, '--blob-budget');
  const blobBudget = blobBudgetArg === undefined ? undefined : Number(blobBudgetArg);
  if (blobBudget !== undefined && (!Number.isFinite(blobBudget) || blobBudget <= 0)) {
    throw new RelayCliError(
      `Invalid --blob-budget: ${String(blobBudgetArg)} — expected a positive number of bytes`,
    );
  }

  // Auth is opt-in and off by default.
  // @issue DTX-7041: a declared-but-empty token is refused loudly — an unset CI secret, not a real value.
  const flagToken = getArg(argv, '--token');
  const envToken = env.DETOX_RELAY_TOKEN;
  const givenToken = flagToken ?? envToken;
  if (givenToken === '') {
    throw new RelayCliError(
      'DETOX_RELAY_TOKEN (or --token) is declared but empty — set a real token to ' +
        'turn auth on, or remove it entirely to run with auth off.',
    );
  }
  return {
    port,
    host,
    auth: givenToken === undefined ? undefined : { type: 'static-token', token: givenToken },
    keepalive,
    nodesFile,
    blobBudget,
    blobRoot: env.DETOX_BLOB_ROOT || undefined,
  };
}

/**
 * The URL a client can actually dial — wildcard binds announce a reachable
 * interface address instead of themselves.
 */
export function dialableUrl(bindHost: string, boundPort: number): string {
  const isWildcard = bindHost === '0.0.0.0' || bindHost === '::';
  const target = isWildcard ? reachableAddress(bindHost === '::' ? '::1' : '127.0.0.1') : bindHost;
  const authority = target.includes(':') ? `[${target}]` : target;
  return `ws://${authority}:${String(boundPort)}`;
}

/** IPv4 first: more clients and more humans can use one, and `::` accepts it too. */
function reachableAddress(fallback: string): string {
  const external = Object.values(networkInterfaces())
    .flatMap((interfaces) => interfaces ?? [])
    .filter((iface) => !iface.internal);
  const ipv4 = external.find((iface) => iface.family === 'IPv4');
  return (ipv4 ?? external[0])?.address ?? fallback;
}
