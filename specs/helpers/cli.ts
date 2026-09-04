/**
 * Test-side handle on the real `detox` CLI (spec 009). Spawns the built
 * artifact — `dist/cli/detox.js`, the server/relay CLI convention — never
 * workspace source: the command's public interface is argv, environment,
 * exit code and output, and that is what these helpers hand back.
 *
 * Environment hygiene: the accept runner's own environment carries
 * `DETOX_SERVER_URL`/`DETOX_SERVER_TOKEN` (the spec-harness convention) and
 * could carry `DETOX_CONFIGURATION` and friends. The product CLI must answer
 * to the temp project's config alone, so every ambient variable the product
 * (or the harness) treats as meaningful is stripped before `options.env` is
 * merged — a test that wants one sets it explicitly.
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { waitUntilListening } from './server';
import { waitUntil } from './simctl';

/** Built by `yarn build` (the accept runner builds first), like the server's. */
const DETOX_CLI = path.resolve(__dirname, '../../detox/dist/cli/detox.js');

const AMBIENT_KEYS = [
  'DETOX_CONFIGURATION',
  'DETOX_CONFIG_PATH',
  'DETOX_CLIENT_SERVER',
  'DETOX_CLIENT_TOKEN',
  'DETOX_CONFIG_SNAPSHOT_PATH',
  'DETOX_SERVER_URL',
  'DETOX_LOCAL_HELPER_ROOT',
  // Hand-kept, not imported from `@detox-remote/*` — helpers stay on the
  // public dialect the way accept files do.
  'DETOX_SERVER_HOST',
  'DETOX_SERVER_PORT',
  'DETOX_SERVER_TOKEN',
  'DETOX_SERVER_MAX_POOL',
  'DETOX_SERVER_KEEPALIVE_WINDOW',
  'DETOX_SERVER_BLOB_BUDGET',
  'DETOX_SERVER_LOG_LEVEL',
  'DETOX_SERVER_LOG_RETENTION',
  'DETOX_SERVER_LOG_BUDGET',
  'DETOX_SERVER_CHILD_OUTPUT_BUDGET',
  'DETOX_SERVER_APP_OUTPUT_BUDGET',
  'DETOX_RELAY_HOST',
  'DETOX_RELAY_PORT',
  'DETOX_RELAY_TOKEN',
  'DETOX_RELAY_NODES',
  'DETOX_RELAY_KEEPALIVE_WINDOW',
  'DETOX_RELAY_BLOB_BUDGET',
  'DETOX_RELAY_LOG_LEVEL',
  'DETOX_RELAY_LOG_RETENTION',
  'DETOX_RELAY_LOG_BUDGET',
] as const;

/**
 * One connection-log root for every CLI this accept process spawns. Not the
 * machine's real one (an accept run must not write there), and not a fresh
 * one per spawn: a `detox logs` must read what a `detox test` — or the local
 * helper it started — wrote, and they find each other by this root. A server
 * that wants a root of its own says so (see `startServingVerb`), because the
 * root is a one-live-server lock (spec 012).
 */
const SUITE_LOG_ROOT = mkdtempSync(path.join(tmpdir(), 'detox-cli-logs-'));

function cliEnv(overrides?: Readonly<Record<string, string>>, verb: 'server' | 'relay' = 'server'): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env };
  for (const key of AMBIENT_KEYS) delete env[key];
  // A spawned CLI can open a blob store (the run-scoped server inside
  // `detox test`, the `detox server` verb) — without this seam every accept
  // run would write into, and LRU-evict, the machine's real build cache
  // (see helpers/server.ts).
  const blobRootVar = verb === 'server' ? 'DETOX_SERVER_BLOB_ROOT' : 'DETOX_RELAY_BLOB_ROOT';
  const logRootVar = verb === 'server' ? 'DETOX_SERVER_LOG_ROOT' : 'DETOX_RELAY_LOG_ROOT';
  env[blobRootVar] = mkdtempSync(path.join(tmpdir(), 'detox-cli-blob-store-'));
  env[logRootVar] = SUITE_LOG_ROOT;
  return { ...env, ...overrides };
}

export interface DetoxCliResult {
  readonly exitCode: number | null;
  readonly signalCode: NodeJS.Signals | null;
  readonly stdout: string;
  readonly stderr: string;
  /** stdout + stderr, for "this string appears nowhere" assertions. */
  readonly output: string;
}

export interface DetoxCliOptions {
  /** The project directory — the CLI resolves config and spawns runners from here. */
  cwd: string;
  env?: Readonly<Record<string, string>>;
  signal?: AbortSignal;
}

export interface DetoxCliHandle {
  /** The pid of the CLI process itself. */
  readonly pid: number | undefined;
  /** Sends SIGINT — the Ctrl+C the accept's teardown test performs. */
  interrupt(): void;
  /**
   * Resolves once the combined output so far matches `pattern` (spec 016:
   * a test that interrupts a build has to know the build is under way).
   * Rejects if the process exits first without matching.
   */
  waitForOutput(pattern: RegExp, options?: WaitForOutputOptions): Promise<void>;
  wait(): Promise<DetoxCliResult>;
}

export interface WaitForOutputOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
}

export function spawnDetoxCli(args: readonly string[], options: DetoxCliOptions): DetoxCliHandle {
  const child = spawn('node', [DETOX_CLI, ...args], {
    cwd: options.cwd,
    env: cliEnv(options.env),
    stdio: ['ignore', 'pipe', 'pipe'],
    signal: options.signal,
  });
  const stdout: string[] = [];
  const stderr: string[] = [];
  child.stdout?.on('data', (chunk: Buffer) => stdout.push(chunk.toString()));
  child.stderr?.on('data', (chunk: Buffer) => stderr.push(chunk.toString()));

  const { promise, resolve, reject } = Promise.withResolvers<DetoxCliResult>();
  // `close`, not `exit`: the pipes are drained by then, so a waiter that
  // gives up on a closed process has seen the last chunk.
  let closed = false;
  child.on('error', (error: Error) => reject(error));
  child.on('close', (exitCode, signalCode) => {
    closed = true;
    const out = stdout.join('');
    const err = stderr.join('');
    resolve({ exitCode, signalCode, stdout: out, stderr: err, output: out + err });
  });

  // A test process dying before its assertions must not leave a CLI (and the
  // runner + server underneath it) re-parented to launchd.
  const killOnExit = (): void => {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
  };
  process.once('exit', killOnExit);
  void promise.finally(() => process.removeListener('exit', killOnExit)).catch(() => undefined);

  return {
    pid: child.pid,
    interrupt: (): void => {
      child.kill('SIGINT');
    },
    waitForOutput: (pattern, options = {}): Promise<void> =>
      waitUntil(
        () => {
          if (pattern.test(stdout.join('') + stderr.join(''))) return true;
          if (closed) {
            throw new Error(`the CLI exited before its output matched ${String(pattern)}:\n${stdout.join('')}${stderr.join('')}`);
          }
          return false;
        },
        { ...options, description: `CLI output matching ${String(pattern)}` },
      ),
    wait: (): Promise<DetoxCliResult> => promise,
  };
}

/** Spawn, wait for exit, hand back the whole observable result. */
export function runDetoxCli(
  args: readonly string[],
  options: DetoxCliOptions,
): Promise<DetoxCliResult> {
  return spawnDetoxCli(args, options).wait();
}

export interface DetoxServingVerbHandle extends AsyncDisposable {
  readonly url: string;
  stop(): Promise<void>;
}

const SERVING_VERB_READY_TIMEOUT_MS = 15_000;
const SIGKILL_AFTER_MS = 3_000;

export interface StartDetoxServerVerbOptions {
  /**
   * Absent → auth off (the default); present → the server requires this
   * bearer token, supplied through the config file's `server.auth` block
   * (the path the frozen accept tests must exercise).
   */
  token?: string;
  signal?: AbortSignal;
}

export interface StartDetoxRelayVerbOptions {
  /** Path to the roster file `detox relay --nodes` reads (entries may omit `token`). */
  nodesFile: string;
  /** Absent → the relay's own listener runs with auth off. */
  token?: string;
  signal?: AbortSignal;
}

/**
 * `detox server` — the standing device-owning server (replacing the v20
 * name `run-server`), started through the CLI under test.
 * Spec 009 pins that the delegation preserves the server CLI's flags and
 * its IPC readiness announce, which is what this waits on.
 *
 * The verb is driven from a config file: the helper writes a `.detoxrc.json`
 * whose `server` section carries the port and the (optional) auth token, and
 * passes no flags and no env credential — so every accept test that starts a
 * serving verb also proves the verb actually reads the config's `server`
 * section, the path the eleven frozen tests could not otherwise see.
 */
export async function startDetoxServerVerb(
  options: StartDetoxServerVerbOptions = {},
): Promise<DetoxServingVerbHandle> {
  return startServingVerb(
    'server',
    {
      port: 0,
      ...(options.token !== undefined
        ? { auth: { type: 'static-token', token: options.token } }
        : {}),
    },
    options.signal,
  );
}

/**
 * `detox relay` — the fleet's front door as a verb, a separate process from
 * any node. Same readiness contract, same config-file conduct: the roster the
 * caller wrote to `nodesFile` is inlined into the config's `server.nodes`
 * (the in-process lane — node tokens touch no temp file on the product
 * side), and the relay's own listener token, when given, rides the same
 * `server.auth` block.
 */
export async function startDetoxRelayVerb(
  options: StartDetoxRelayVerbOptions,
): Promise<DetoxServingVerbHandle> {
  const nodes: unknown = JSON.parse(readFileSync(options.nodesFile, 'utf8'));
  return startServingVerb(
    'relay',
    {
      port: 0,
      nodes,
      ...(options.token !== undefined
        ? { auth: { type: 'static-token', token: options.token } }
        : {}),
    },
    options.signal,
  );
}

async function startServingVerb(
  verb: 'server' | 'relay',
  serverSection: Record<string, unknown>,
  signal: AbortSignal | undefined,
): Promise<DetoxServingVerbHandle> {
  // A scratch cwd: the serving verbs discover config files upward from cwd,
  // and a stray `.detoxrc` in the repo root or any ancestor would silently
  // supply bind/auth defaults to these tests. The config written here is
  // the one the verb must find and obey.
  const cwd = mkdtempSync(path.join(tmpdir(), 'detox-serving-verb-cwd-'));
  writeFileSync(path.join(cwd, '.detoxrc.json'), JSON.stringify({ server: serverSection }));
  const logRootVar = verb === 'server' ? 'DETOX_SERVER_LOG_ROOT' : 'DETOX_RELAY_LOG_ROOT';
  const child: ChildProcess = spawn('node', [DETOX_CLI, verb], {
    cwd,
    // Its own log root: the root is a one-live-server lock (spec 012), and a
    // test may stand two serving verbs up at once (an open door and a guarded
    // one). Sharing the suite's root would refuse the second with
    // `DETOX_LOG_ROOT_HELD`.
    env: cliEnv({ [logRootVar]: mkdtempSync(path.join(tmpdir(), `detox-${verb}-logs-`)) }, verb),
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
    signal,
  });
  // Piped without a reader, a chatty server wedges on a full pipe buffer.
  child.stdout?.resume();
  child.stderr?.resume();

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
    const hardKill = setTimeout(() => child.kill('SIGKILL'), SIGKILL_AFTER_MS);
    hardKill.unref();
    await promise;
  };

  let url: string;
  try {
    url = await waitUntilListening(child, SERVING_VERB_READY_TIMEOUT_MS);
  } catch (error) {
    await stop();
    throw error;
  }
  return { url, stop, [Symbol.asyncDispose]: stop };
}
