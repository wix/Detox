import { networkInterfaces } from 'node:os';

import {
  createDetoxRemoteServer,
  DEFAULT_HOST,
  type ServerDeps,
} from './server';
import { KEEPALIVE_OFF, type KeepaliveConfig } from './keepalive';
import type { AuthConfig } from './auth';
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
  --port <number>     Port to listen on (default: 8080, or env PORT; 0 = pick a free one)
  --host <address>    Interface to bind (default: ${DEFAULT_HOST}, or env DETOX_SERVER_HOST).
                      Use 0.0.0.0 to accept connections from the LAN.
  --max-pool <number> Max device pool size (default: 4, or env DETOX_REMOTE_MAX_POOL)
  --blob-budget <bytes>
                      Byte budget of the build cache (the blob store behind
                      installApp uploads). Least-recently-used builds are
                      evicted when a new upload needs the room. Default: 8 GiB.
                      The store lives at ~/Library/Caches/detox-server/blobs
                      and survives restarts; the location is not configurable.
  --keepalive-window <seconds>
                      How long a client may stay unresponsive before its
                      session ends and its devices return to the pool
                      (default: 120, max: 604800 = 7 days, or env
                      DETOX_REMOTE_KEEPALIVE_WINDOW). Any event-loop pause
                      counts — a debugger breakpoint, heavy synchronous work.
                      Reclaim may run up to a third of the window late.
                      Raise it for debug-heavy days. 0 turns liveness polls
                      OFF entirely: devices held by a silently vanished
                      client are then never reclaimed until the server
                      restarts — your own risk.
  --help, -h          Show this help

Authentication (opt-in, OFF by default):
  With no token configured the door is open — fine on the default loopback
  bind. Configure a token and clients must send
  "Authorization: Bearer <token>".

  DETOX_SERVER_TOKEN  Preferred way to supply a token.
  --token <string>    Same, but a command line is visible to every process on
                      the machine (\`ps\`), so prefer the environment variable
                      for any token that outlives a single run.
`;

/**
 * A flag either has a real value or the invocation is refused: returning
 * the next flag as a value (\`--host --port 8099\` → host "--port") would be
 * a silent misparse, so a missing value is an error naming the flag instead.
 */
function getArg(argv: readonly string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  if (i === -1) return undefined;
  const value = argv[i + 1];
  if (value === undefined || value.startsWith('-')) {
    console.error(`Missing value for ${name}`);
    process.exit(1);
  }
  return value;
}

const KEEPALIVE_MISSES = 3;
// Past ~74 days the derived interval overflows Node's 32-bit timer, and
// setInterval clamps to 1ms — a ping storm that kills every client within
// milliseconds. A week is already "effectively off".
const KEEPALIVE_WINDOW_MAX_SEC = 604_800;

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
    console.log(HELP);
    process.exit(0);
  }

  const port = Number(getArg(argv, '--port') ?? env.PORT ?? 8080);
  const host = getArg(argv, '--host') ?? env.DETOX_SERVER_HOST ?? DEFAULT_HOST;
  const maxPool = Number(getArg(argv, '--max-pool') ?? env.DETOX_REMOTE_MAX_POOL ?? 4);

  // The blob lane's one operator knob (spec 007). The store's
  // location is not an option; DETOX_BLOB_ROOT is an @internal test seam so
  // accept runs never share a store with the machine's real server.
  const blobBudgetArg = getArg(argv, '--blob-budget');
  const blobBudget = blobBudgetArg === undefined ? undefined : Number(blobBudgetArg);
  if (blobBudget !== undefined && (!Number.isFinite(blobBudget) || blobBudget <= 0)) {
    console.error(
      `Invalid --blob-budget: ${String(blobBudgetArg)} — expected a positive number of bytes`,
    );
    process.exit(1);
  }
  const blobRoot = env.DETOX_BLOB_ROOT || undefined;

  // The window is the contract number a paused client experiences ("a pause
  // longer than N seconds ends your session"), so the flag speaks in exactly
  // that number; the ping cadence is derived. Operator-only: a client-chosen
  // window would let the client dictate the server's pool-capacity policy.
  //
  // `||`, not `??` — a declared-but-empty DETOX_REMOTE_KEEPALIVE_WINDOW= (an
  // unset CI variable) is not a configuration, and `Number('')` is 0, which
  // means "no liveness polls, ever": an empty line in a compose
  // file must not silently disable device reclaim. An explicit '0' is
  // truthy and survives.
  const keepaliveWindowSec = Number(
    getArg(argv, '--keepalive-window') || env.DETOX_REMOTE_KEEPALIVE_WINDOW || 120,
  );
  if (
    !Number.isFinite(keepaliveWindowSec) ||
    keepaliveWindowSec < 0 ||
    keepaliveWindowSec > KEEPALIVE_WINDOW_MAX_SEC
  ) {
    console.error(
      `Invalid --keepalive-window: ${String(keepaliveWindowSec)} — expected seconds between 0 and ${String(KEEPALIVE_WINDOW_MAX_SEC)} (7 days); 0 = no liveness polls`,
    );
    process.exit(1);
  }
  // `0` is legal and means off: no pings, no
  // reclaim-on-silence, the operator owns the leak risk.
  const keepalive: KeepaliveConfig =
    keepaliveWindowSec === 0
      ? KEEPALIVE_OFF
      : {
          intervalMs: (keepaliveWindowSec * 1000) / KEEPALIVE_MISSES,
          maxMissedPongs: KEEPALIVE_MISSES,
        };

  // Auth is opt-in and off by default: a token
  // configures the bearer check, no token leaves the door open — the default
  // bind is loopback, so open-by-default exposes nothing beyond this
  // machine. A declared-but-empty token is refused loudly rather than read
  // as either choice: `DETOX_SERVER_TOKEN=` in a CI config is an unset
  // secret, and silently opening the door on it would defeat an operator
  // who meant to guard it.
  const flagToken = getArg(argv, '--token');
  const envToken = env.DETOX_SERVER_TOKEN;
  const givenToken = flagToken ?? envToken;
  if (givenToken === '') {
    console.error(
      'DETOX_SERVER_TOKEN (or --token) is declared but empty — set a real token to ' +
        'turn auth on, or remove it entirely to run with auth off.',
    );
    process.exit(1);
  }
  const auth: AuthConfig | undefined =
    givenToken === undefined ? undefined : { type: 'static-token', token: givenToken };
  if (auth === undefined && !LOOPBACK_HOSTS.has(host)) {
    console.warn(
      `WARNING: auth is OFF and the bind (${host}) is not loopback — anyone on the ` +
        'network can drive this device farm. Set DETOX_SERVER_TOKEN to guard the door.',
      );
  }

  const localHelperToken = env.DETOX_LOCAL_HELPER_TOKEN || undefined;
  if (env.DETOX_LOCAL_HELPER_TOKEN === '') {
    console.error('DETOX_LOCAL_HELPER_TOKEN is declared but empty — helper ownership would be unprovable.');
    process.exit(1);
  }
  if (localHelperToken !== undefined && !LOOPBACK_HOSTS.has(host)) {
    console.error('DETOX_LOCAL_HELPER_TOKEN may only enable helper admin on a loopback-bound server.');
    process.exit(1);
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
  };
  const server = await createDetoxRemoteServer(deps);
  const url = dialableUrl(host, server.port);
  console.log(`Server listening on ${url} (maxPool=${String(maxPool)}, auth ${auth ? 'on' : 'off'})`);

  // Machine-readable readiness for whoever spawned us. With `--port 0` the OS
  // picks the port, so the parent cannot know the URL up front and scraping
  // the human log line would be fragile. When spawned with an IPC channel we
  // hand it over directly instead.
  process.send?.({ type: 'listening', url, token: auth?.token, serverVersion: SERVER_VERSION });

  const shutdown = async (): Promise<void> => {
    console.log('Shutting down...');
    await server.close();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown());
  process.on('SIGTERM', () => void shutdown());
}
