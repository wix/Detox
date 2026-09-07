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

import {
  KEEPALIVE_OFF,
  parseDuration,
  type AuthConfig,
  type KeepaliveConfig,
  type LogLevel,
} from '@detox-remote/server';
import { resolveSection, SettingsError } from '@detox-remote/core';
import { RELAY_SETTINGS } from './settings';

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
  /** The relay's own connection log (spec 008) — knobs mirror the server's. */
  logLevel?: LogLevel;
  logRetentionMs?: number;
  logBudget?: number;
  logRoot?: string;
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

const KEEPALIVE_MISSES = 3;
const DEFAULT_KEEPALIVE_WINDOW_SEC = 120;
const DEFAULT_PORT = 0;

export function resolveRelayCli({ argv, env, hasInlineNodes = false }: RelayCliArgs): ResolvedRelayCli {
  let resolved;
  try {
    resolved = resolveSection(RELAY_SETTINGS, { argv, env });
  } catch (err) {
    if (err instanceof SettingsError) throw new RelayCliError(err.message);
    throw err;
  }

  const port = resolved.port ?? DEFAULT_PORT;
  const host = resolved.host ?? '127.0.0.1';

  // Not a resolvable setting: names a FILE, and required-ness depends on `hasInlineNodes`.
  const nodesFile = getArg(argv, '--nodes') || env.DETOX_RELAY_NODES;
  if (!nodesFile && !hasInlineNodes) {
    throw new RelayCliError(
      'Missing a node roster: pass --nodes <file> (or DETOX_RELAY_NODES, or a ' +
        '`server.nodes` list in the detox config) — a relay needs its fleet, a JSON ' +
        'array of { "name", "url", "token"? }. A file, never argv: node tokens are ' +
        'secrets and a command line is readable by every process on the machine.',
    );
  }

  // The window is the contract number a paused client experiences; the ping
  // cadence is derived. Operator-only: a client-chosen window would be the
  // client dictating the relay's pool policy. `0` is legal and means off —
  // the same rule as the server's.
  const keepaliveWindowSec = resolved.keepaliveWindow ?? DEFAULT_KEEPALIVE_WINDOW_SEC;
  const keepalive: KeepaliveConfig =
    keepaliveWindowSec === 0
      ? KEEPALIVE_OFF
      : {
          intervalMs: (keepaliveWindowSec * 1000) / KEEPALIVE_MISSES,
          maxMissedPongs: KEEPALIVE_MISSES,
        };

  return {
    port,
    host,
    // Auth is opt-in and off by default. A declared-but-empty token already
    // refused, loudly, inside `resolveSection` (the settings schema's
    // `.min(1)`) — an unset CI secret, not a real value.
    auth: resolved.token === undefined ? undefined : { type: 'static-token', token: resolved.token },
    keepalive,
    nodesFile,
    blobBudget: resolved.blobBudget,
    blobRoot: resolved.blobRoot,
    // The relay's own connection log (spec 008) — the same knobs as the server's.
    logLevel: resolved.logLevel,
    // `resolved.logRetention` is a duration string (`10m`), validated
    // already by the settings schema — converted to ms here, once.
    logRetentionMs: resolved.logRetention === undefined ? undefined : parseDuration(resolved.logRetention),
    logBudget: resolved.logBudget,
    logRoot: resolved.logRoot,
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
