import { networkInterfaces } from 'node:os';

import {
  createDetoxRemoteServer,
  DEFAULT_HOST,
  type ServerDeps,
} from './server';
import { KEEPALIVE_OFF, type KeepaliveConfig } from './keepalive';
import type { AuthConfig } from './auth';
import { DEFAULT_LOCAL_HELPER_RETENTION_MS, DEFAULT_NODE_RETENTION_MS } from './LogStore';
import { DetoxErrorCode, resolveSection, SettingsError, helpLines } from '@detox-remote/core';
import type { LogLevel } from './log-sink';
import { SERVER_SETTINGS } from './settings';
import { parseDuration } from './duration';
import serverPackage from '../package.json';

interface ServerPackageJson {
  version: string;
}

const SERVER_VERSION = (serverPackage as ServerPackageJson).version;

/**
 * The server CLI's whole logic, callable — `detox server` (spec 009)
 * delegates here, and the legacy `dist/server/cli.js` entry
 * the accept helpers spawn is a two-line shell over it. One main, two
 * doors that cannot drift flag-for-flag.
 */
export interface ServerCliInput {
  argv: readonly string[];
  env: Readonly<Record<string, string | undefined>>;
}

const HELP = `
detox server — a device-owning Detox Server (also reachable as the legacy
dist/server/cli.js entry)

Usage:
  detox server [options]

Options:
${helpLines(SERVER_SETTINGS)}
  --help, -h          Show this help

Notes:
  --blob-budget: the store lives at ~/Library/Caches/detox-server/blobs and
    survives restarts; the location is not configurable.
  --keepalive-window: any event-loop pause counts — a debugger breakpoint,
    heavy synchronous work. Reclaim may run up to a third of the window late.
    0 turns liveness polls OFF entirely: devices held by a silently vanished
    client are then never reclaimed until the server restarts — your own risk.
  --log-retention: logs live under ~/Library/Logs/detox-server and are served
    from GET /v1/runs on this port.
  --child-output-budget: a failed child's output is always kept, every
    child's at --log-level debug.

Authentication (opt-in, OFF by default):
  With no token configured the door is open — fine on the default loopback
  bind. Configure a token and clients must send
  "Authorization: Bearer <token>". Prefer DETOX_SERVER_TOKEN over --token —
  a command line is visible to every process on the machine (\`ps\`).
`;

/** `console` left this package with spec 012: the CLI's own complaints go straight to stderr. */
function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

interface CodedError {
  code?: number;
}

const KEEPALIVE_MISSES = 3;

const LOOPBACK_HOSTS = new Set(['127.0.0.1', '::1', 'localhost']);

/**
 * The URL a client can actually dial.
 *
 * `0.0.0.0` and `::` mean "every interface" — they are bind addresses, not
 * destinations, and announcing them hands a spawner something it cannot
 * connect to. Announce a reachable address instead, and fall back to
 * loopback only on a machine that has none.
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

export async function runServerCli({ argv, env }: ServerCliInput): Promise<void> {
  if (argv.includes('--help') || argv.includes('-h')) {
    process.stdout.write(`${HELP}\n`);
    process.exit(0);
  }

  let resolved;
  try {
    resolved = resolveSection(SERVER_SETTINGS, { argv, env });
  } catch (err) {
    if (err instanceof SettingsError) fail(err.message);
    throw err;
  }

  const port = resolved.port ?? 8080;
  const host = resolved.host ?? DEFAULT_HOST;
  const maxPool = resolved.maxPool ?? 4;
  // The blob lane's one operator knob (spec 007). The store's location is
  // not an option; `blobRoot` is an @internal test seam so accept runs never
  // share a store with the machine's real server.
  const blobBudget = resolved.blobBudget;
  const blobRoot = resolved.blobRoot;
  // The connection log (spec 012). `logRoot` is the @internal seam like
  // `blobRoot`; retention is the operator's knob, the byte budget the
  // seatbelt under it.
  const logRoot = resolved.logRoot;
  const logLevel: LogLevel | undefined = resolved.logLevel;
  // `resolved.logRetention` is a validated duration string — ms only here.
  const retentionMs = resolved.logRetention === undefined ? undefined : parseDuration(resolved.logRetention);
  const logBudget = resolved.logBudget;
  // The two output budgets (spec 013): what of a child's and of the app's
  // own streams the connection log keeps.
  const childOutputBudget = resolved.childOutputBudget;
  const appOutputBudget = resolved.appOutputBudget;

  // The window is the contract number a paused client experiences ("a pause
  // longer than N seconds ends your session"), so the flag speaks in exactly
  // that number; the ping cadence is derived. Operator-only: a client-chosen
  // window would let the client dictate the server's pool-capacity policy.
  const keepaliveWindowSec = resolved.keepaliveWindow ?? 120;
  // `0` is legal and means off: no pings, no
  // reclaim-on-silence, the operator owns the leak risk.
  const keepalive: KeepaliveConfig =
    keepaliveWindowSec === 0
      ? KEEPALIVE_OFF
      : {
          intervalMs: (keepaliveWindowSec * 1000) / KEEPALIVE_MISSES,
          maxMissedPongs: KEEPALIVE_MISSES,
        };

  // Auth is opt-in and off by default: a token configures the bearer check,
  // no token leaves the door open — the default bind is loopback, so
  // open-by-default exposes nothing beyond this machine. A declared-but-empty
  // token already refused, loudly, inside `resolveSection` (the settings
  // schema's `.min(1)`) — `DETOX_SERVER_TOKEN=` in a CI config is an unset
  // secret, and silently opening the door on it would defeat an operator who
  // meant to guard it.
  const auth: AuthConfig | undefined =
    resolved.token === undefined ? undefined : { type: 'static-token', token: resolved.token };
  if (auth === undefined && !LOOPBACK_HOSTS.has(host)) {
    process.stderr.write(
      `WARNING: auth is OFF and the bind (${host}) is not loopback — anyone on the ` +
        'network can drive this device farm. Set DETOX_SERVER_TOKEN to guard the door.\n',
    );
  }

  const localHelperToken = env.DETOX_LOCAL_HELPER_TOKEN || undefined;
  if (env.DETOX_LOCAL_HELPER_TOKEN === '') {
    fail('DETOX_LOCAL_HELPER_TOKEN is declared but empty — helper ownership would be unprovable.');
  }
  if (localHelperToken !== undefined && !LOOPBACK_HOSTS.has(host)) {
    fail('DETOX_LOCAL_HELPER_TOKEN may only enable helper admin on a loopback-bound server.');
  }

  const deps: ServerDeps = {
    port,
    host,
    maxPool,
    auth,
    keepalive,
    // The injectable Detox framework for `launchApp` (spec 003). Environment,
    // not a flag: it is deployment configuration, set once per machine next to
    // the framework cache itself.
    iosFrameworkPath: env.DETOX_IOS_FRAMEWORK_PATH || undefined,
    blobs: { root: blobRoot, budgetBytes: blobBudget },
    ...(localHelperToken !== undefined ? { localHelper: { token: localHelperToken } } : {}),
    logs: {
      root: logRoot,
      // A node forgets in minutes (CI collects right after the run); the
      // developer's own helper keeps a day, since nobody collects for them.
      retentionMs:
        retentionMs ?? (localHelperToken !== undefined ? DEFAULT_LOCAL_HELPER_RETENTION_MS : DEFAULT_NODE_RETENTION_MS),
      budgetBytes: logBudget,
    },
    logLevel,
    childOutputBudgetBytes: childOutputBudget,
    appOutputBudgetBytes: appOutputBudget,
  };
  let server;
  try {
    server = await createDetoxRemoteServer(deps);
  } catch (err) {
    // The typed startup refusal (one server per log root): named to the
    // human on stderr and, when a spawner listens, over IPC by code — a
    // helper can then tell "held" from "any failure".
    if ((err as CodedError).code === DetoxErrorCode.DETOX_LOG_ROOT_HELD) {
      const message = (err as Error).message;
      process.send?.({ type: 'refused', code: 'DETOX_LOG_ROOT_HELD', message });
      fail(message);
    }
    throw err;
  }
  const url = dialableUrl(host, server.port);
  // Not behind --log-level: this is the readiness line the spawners grep.
  process.stdout.write(`Server listening on ${url} (maxPool=${String(maxPool)}, auth ${auth ? 'on' : 'off'})\n`);

  // Machine-readable readiness for whoever spawned us. With `--port 0` the OS
  // picks the port, so the parent cannot know the URL up front and scraping
  // the human log line would be fragile. When spawned with an IPC channel we
  // hand it over directly instead.
  process.send?.({ type: 'listening', url, token: auth?.token, serverVersion: SERVER_VERSION });

  // Graceful: every connection's log is complete (its `conn` end on disk)
  // before the process exits — the spawner's SIGKILL is the only backstop.
  const shutdown = async (): Promise<void> => {
    process.stdout.write('Shutting down...\n');
    await server.close();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown());
  process.on('SIGTERM', () => void shutdown());
}
