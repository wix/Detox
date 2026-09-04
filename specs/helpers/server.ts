/**
 * Test-side Detox Server handle.
 *
 * Acceptance specs must not each re-derive `process.env.DETOX_SERVER_URL`.
 * They call `startServer()` and get back an address object they hand straight
 * to `connect({ server })`.
 *
 * Two modes, chosen automatically:
 *  - **attach** — `DETOX_SERVER_URL` is set (this is what `yarn accept` does:
 *    the runner spawns the server, so the spec attaches to it). `stop()` is a
 *    no-op; the runner owns the process. The runner's token arrives as
 *    `DETOX_SERVER_TOKEN`.
 *  - **spawn** — no env var: the helper starts `detox/dist/server/cli.js` itself, so
 *    a spec can also be run directly (`node --import tsx --test specs/…`). The
 *    helper mints a fresh token per run and hands it to the server.
 *
 * Either way the spec gets an address that already carries its `Authorization`
 * header, so no acceptance test has to know that the server authenticates.
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import type { DetoxServerAddress } from 'detox/client';

export interface StartServerOptions {
  /**
   * Spawn a private server even when `DETOX_SERVER_URL` says to attach.
   * For specs that need server flags the shared runner server does not have
   * (e.g. a one-slot pool), or that kill their server as part of the test.
   */
  dedicated?: boolean;
  /** `--max-pool` for a spawned server; ignored in attach mode. */
  maxPool?: number;
  /** Port to listen on when spawning; `0` (the default) picks a free one. */
  port?: number;
  /**
   * Extra handshake headers forwarded to `connect({ server })`. `Authorization` is
   * supplied automatically; pass it here only to override it (a test that
   * wants to be turned away).
   */
  headers?: Readonly<Record<string, string>>;
  /** How long to wait for the spawned server to report it is listening. */
  readyTimeoutMs?: number;
  /** Aborts the wait (and kills the spawned server) — pass `t.signal`. */
  signal?: AbortSignal;
  /**
   * Path to the injectable Detox iOS framework binary (spec 003): forwarded
   * to a spawned server as `DETOX_IOS_FRAMEWORK_PATH`, so `launchApp` can
   * inject real instrumentation. Ignored in attach mode — specs that need it
   * ask for a `dedicated` server.
   */
  iosDetoxFrameworkPath?: string;
  /**
   * Blob-store isolation (spec 007). `isolatedBlobStore` mints a fresh temp
   * directory and hands it to the spawned server as `DETOX_SERVER_BLOB_ROOT` (an
   * internal test seam — the operator surface has no location knob), so
   * accept runs never share a store with the machine's real server or with
   * each other. `blobRoot` points a server at
   * an existing root instead — the restart-survival test starts its second
   * server on the first one's store. The root is not deleted on stop: the
   * store surviving the server is the property under test; temp roots are
   * left to the OS tmp reaper.
   *
   * Any of these three options implies a spawned (dedicated) server: a store
   * you can isolate is a store you own. Silently ignoring them in attach
   * mode — the `iosDetoxFrameworkPath` convention — would be a trap here: an
   * "isolated" test attached to the shared runner server would poison its
   * dedup counts with the real store and point its tiny eviction budget at
   * the machine's real cache.
   */
  isolatedBlobStore?: boolean;
  blobRoot?: string;
  /** `--blob-budget` (bytes) for the spawned server. */
  blobBudget?: number;
  /**
   * Connection-log isolation (spec 012), the blob-store shape above applied
   * to `DETOX_SERVER_LOG_ROOT`: `isolatedLogRoot` mints a fresh temp root, `logRoot`
   * points a server at an existing one (the restart tests). Either implies a
   * dedicated server. The root is not deleted on stop.
   */
  isolatedLogRoot?: boolean;
  logRoot?: string;
  /** `--log-level` for the spawned server (stdout threshold; the file always keeps debug). */
  logLevel?: 'error' | 'warn' | 'info' | 'debug';
  /** `--app-output-budget` (bytes per launch) for the spawned server (spec 013). Implies a dedicated server. */
  appOutputBudget?: number;
}

/**
 * A spawned server that refused to start with a typed reason (spec 012's
 * one-server-per-log-root): `refusalCode` is the refusal's Detox code name,
 * so a test can tell "held" from "any failure".
 */
export class ServerStartupRefusal extends Error {
  constructor(
    readonly refusalCode: string,
    message: string,
  ) {
    super(message);
    this.name = 'ServerStartupRefusal';
  }
}

/** What a spec gets back: an address to connect to, plus its teardown. */
export interface DetoxServerHandle extends AsyncDisposable {
  readonly address: DetoxServerAddress;
  readonly url: string;
  /** Whether this helper owns the server process. */
  readonly spawned: boolean;
  /**
   * The blob-store root this server was pointed at, when the caller asked for
   * one (`isolatedBlobStore` / `blobRoot`) — undefined otherwise. Feed it to
   * another `startServer` call to prove the store outlives the process.
   */
  readonly blobRoot?: string;
  /** The log root this server was pointed at (`isolatedLogRoot` / `logRoot`) — undefined otherwise. */
  readonly logRoot?: string;
  /**
   * Everything the server has written so far (stdout + stderr, in arrival
   * order per stream). Empty in attach mode — the runner owns that process,
   * so specs that read output must ask for a `dedicated` server.
   */
  logs(): string;
  stop(): Promise<void>;
  /**
   * SIGKILL, right now — a Mac dying, not a server shutting down (spec 008's
   * node-death test). Only a spawned (dedicated) server can die on cue;
   * calling this on an attached handle is a test bug and throws.
   *
   * Returns void, not a promise: SIGKILL is sent synchronously. Both spec
   * 012 and spec 008 fire it and forget — a `void` return is what makes that
   * lint-clean for each — and the kernel releases a killed server's
   * log-root lock as it dies, so the next server on that root probes a dead
   * socket and reclaims it.
   */
  kill(): void;
}

const EPHEMERAL_PORT = 0;
/** Matches the server's own default; passed explicitly, never assumed. */
const LOOPBACK = '127.0.0.1';
const DEFAULT_READY_TIMEOUT_MS = 10_000;
const SIGKILL_AFTER_MS = 3_000;
const STDERR_TAIL_CHUNKS = 32;

/**
 * `Authorization` unless the caller overrides it, and never a bare `Bearer `:
 * an empty token is not a credential, and sending one made the client report
 * "your token was rejected" when the truth was "you sent none".
 *
 * Overrides are matched case-insensitively. HTTP header names are
 * case-insensitive but object keys are not, so a test passing `authorization`
 * would otherwise add a *second* header — and Node keeps the first, which is
 * the valid one this helper added. A test written to prove it gets turned away
 * would then quietly be let in.
 */
export function bearerHeaders(
  token: string,
  overrides?: Readonly<Record<string, string>>,
): Record<string, string> {
  const overridesAuth = Object.keys(overrides ?? {}).some(
    (key) => key.toLowerCase() === 'authorization',
  );
  return {
    ...(token && !overridesAuth ? { Authorization: `Bearer ${token}` } : {}),
    ...overrides,
  };
}

function attach(url: string, headers: Record<string, string>): DetoxServerHandle {
  return {
    address: { url, headers },
    url,
    spawned: false,
    logs: (): string => '',
    stop: (): Promise<void> => Promise.resolve(),
    kill: (): void => {
      throw new Error('kill() needs a dedicated server — an attached handle owns no process');
    },
    [Symbol.asyncDispose]: (): Promise<void> => Promise.resolve(),
  };
}

interface ListeningMessage {
  type: 'listening';
  url: string;
}

/** The server's own account of a typed startup refusal, over IPC (spec 012). */
interface RefusedMessage {
  type: 'refused';
  code: string;
  message: string;
}

function isListeningMessage(message: unknown): message is ListeningMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    (message as Partial<ListeningMessage>).type === 'listening' &&
    typeof (message as Partial<ListeningMessage>).url === 'string'
  );
}

function isRefusedMessage(message: unknown): message is RefusedMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    (message as Partial<RefusedMessage>).type === 'refused' &&
    typeof (message as Partial<RefusedMessage>).code === 'string'
  );
}

/**
 * Resolves with the URL the server actually bound. It arrives over the IPC
 * channel rather than being scraped out of the log line, which is what makes
 * `--port 0` usable: the OS picks the port, so the parent cannot know it.
 */
export function waitUntilListening(child: ChildProcess, timeoutMs: number): Promise<string> {
  const { promise, resolve, reject } = Promise.withResolvers<string>();
  const timer = setTimeout(
    () => reject(new Error(`server did not report "listening" within ${timeoutMs}ms`)),
    timeoutMs,
  );
  timer.unref();

  child.on('message', (message: unknown) => {
    if (isListeningMessage(message)) {
      clearTimeout(timer);
      resolve(message.url);
    } else if (isRefusedMessage(message)) {
      clearTimeout(timer);
      reject(new ServerStartupRefusal(message.code, message.message));
    }
  });
  child.once('exit', (code) => {
    clearTimeout(timer);
    reject(new Error(`server exited early (code ${String(code)})`));
  });
  // A ChildProcess with no 'error' listener turns spawn failures — and the
  // AbortError that `spawn({ signal })` emits on abort — into an uncaught
  // exception that kills the test process with no attribution.
  child.once('error', (error: Error) => {
    clearTimeout(timer);
    reject(error);
  });

  return promise;
}

export async function startServer(options: StartServerOptions = {}): Promise<DetoxServerHandle> {
  const fromEnv = process.env.DETOX_SERVER_URL;
  const wantsOwnStore =
    options.isolatedBlobStore === true ||
    options.blobRoot !== undefined ||
    options.blobBudget !== undefined ||
    options.isolatedLogRoot === true ||
    options.logRoot !== undefined ||
    options.logLevel !== undefined ||
    options.appOutputBudget !== undefined;
  if (fromEnv && !options.dedicated && !wantsOwnStore) {
    return attach(fromEnv, bearerHeaders(process.env.DETOX_SERVER_TOKEN ?? '', options.headers));
  }

  // Port 0 by default: node:test runs spec files in parallel, and a fixed port
  // makes the second one die on EADDRINUSE while blaming the wrong thing.
  const port = options.port ?? EPHEMERAL_PORT;
  // A token per run, never a fixed one: a spec that leaks its token into a log
  // leaks nothing that outlives the process.
  const token = randomBytes(16).toString('hex');
  // Anchored to this file, never the caller's cwd: a spec run by hand from
  // `specs/` must find the same build `yarn accept` does (the sibling helpers'
  // convention, e.g. `cli.ts`).
  const cli = path.resolve(__dirname, '../../detox/dist/server/cli.js');
  const flags = ['--port', String(port), '--host', LOOPBACK];
  if (options.maxPool !== undefined) flags.push('--max-pool', String(options.maxPool));
  if (options.blobBudget !== undefined) flags.push('--blob-budget', String(options.blobBudget));
  if (options.logLevel !== undefined) flags.push('--log-level', options.logLevel);
  if (options.appOutputBudget !== undefined) flags.push('--app-output-budget', String(options.appOutputBudget));
  const blobRoot =
    options.blobRoot ??
    (options.isolatedBlobStore ? mkdtempSync(path.join(tmpdir(), 'detox-blob-store-')) : undefined);
  // Every spawned server gets its own log root unless told otherwise: the
  // root is one live server's (its lock socket refuses a second), so two
  // spawned servers sharing the machine's real root would refuse each other.
  const logRoot =
    options.logRoot ??
    (options.isolatedLogRoot || options.dedicated || wantsOwnStore
      ? mkdtempSync(path.join(tmpdir(), 'detox-log-root-'))
      : undefined);
  const child = spawn('node', [cli, ...flags], {
    // The token goes through the environment, not argv: a command line is
    // readable by every process on the machine. `--host` is passed explicitly
    // so an ambient DETOX_SERVER_HOST cannot widen a test server's bind.
    env: {
      ...process.env,
      DETOX_SERVER_PORT: String(port),
      DETOX_SERVER_TOKEN: token,
      ...(options.iosDetoxFrameworkPath
        ? { DETOX_IOS_FRAMEWORK_PATH: options.iosDetoxFrameworkPath }
        : {}),
      ...(blobRoot ? { DETOX_SERVER_BLOB_ROOT: blobRoot } : {}),
      ...(logRoot ? { DETOX_SERVER_LOG_ROOT: logRoot } : {}),
    },
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
    signal: options.signal,
  });

  // Forwarded live, tagged by pid (a two-node test spawns more than one of
  // these concurrently), so a dedicated server's own narration (boot
  // heartbeats, allocation attempts, reclaim) shows up on the accept run's
  // own combined log — not just buffered in memory until the test throws.
  const livePrefix = `[server:${String(child.pid ?? '?')}]`;

  // stderr is piped; without a consumer a chatty server fills the 64KB pipe
  // buffer and wedges mid-write. Keep the tail for error messages.
  const stderrTail: string[] = [];
  child.stderr?.on('data', (chunk: Buffer) => {
    stderrTail.push(chunk.toString());
    if (stderrTail.length > STDERR_TAIL_CHUNKS) stderrTail.shift();
    process.stderr.write(`${livePrefix} ${chunk.toString()}`);
  });
  // stdout likewise needs a consumer — and specs read it (`logs()`): the
  // startup inventory line is a spec-002 instrument. Kept whole, not a tail:
  // "appears exactly once" is only checkable if nothing was dropped.
  const stdoutChunks: string[] = [];
  child.stdout?.on('data', (chunk: Buffer) => {
    stdoutChunks.push(chunk.toString());
    process.stderr.write(`${livePrefix} ${chunk.toString()}`);
  });
  // Past readiness, an abort or a crash must not become an uncaught exception:
  // the failure surfaces through the test's own assertions instead.
  child.on('error', () => {
    /* reported through waitUntilListening, or expected on abort */
  });

  // A test process that dies before its teardown runs (e.g. a fixture
  // throwing at load time) must not re-parent its server to launchd
  // forever: last-resort reaping on our own exit, removed on a normal
  // stop().
  const killOnExit = (): void => {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
  };
  process.once('exit', killOnExit);

  const stop = async (): Promise<void> => {
    process.removeListener('exit', killOnExit);
    if (child.exitCode !== null || child.signalCode !== null) return;
    const { promise, resolve } = Promise.withResolvers<void>();
    child.once('exit', () => {
      clearTimeout(hardKill);
      resolve();
    });
    child.kill('SIGTERM');
    // A server trapping SIGTERM while draining sockets would otherwise make
    // `Symbol.asyncDispose` never settle — the test hangs with no output.
    const hardKill = setTimeout(() => child.kill('SIGKILL'), SIGKILL_AFTER_MS);
    hardKill.unref();
    await promise;
  };

  let url: string;
  try {
    url = await waitUntilListening(child, options.readyTimeoutMs ?? DEFAULT_READY_TIMEOUT_MS);
  } catch (error) {
    await stop();
    // A typed refusal is the whole story: it surfaces as itself, so a test
    // can match its code instead of parsing stderr.
    if (error instanceof ServerStartupRefusal) throw error;
    const stderr = stderrTail.join('').trim();
    throw stderr ? new Error(`${String(error)}\n[server stderr] ${stderr}`, { cause: error }) : error;
  }

  const address: DetoxServerAddress = { url, headers: bearerHeaders(token, options.headers) };

  const logs = (): string => stdoutChunks.join('') + stderrTail.join('');

  const kill = (): void => {
    process.removeListener('exit', killOnExit);
    child.kill('SIGKILL');
  };

  return { address, url, spawned: true, blobRoot, logRoot, logs, stop, kill, [Symbol.asyncDispose]: stop };
}
