/**
 * Test-side relay handle (spec 008) — editable scaffolding, not product API.
 *
 * Mirrors `./server`: spawns `detox/dist/relay/cli.js`, waits for the same IPC
 * `{type: 'listening', url}` announce, mints a fresh client-hop token per
 * run, and writes the hop-pairwise node config to a temp
 * file — node tokens are lifted from each node handle's own address, so no
 * test ever sees or repeats a token.
 *
 * Without a build, spawning fails on the missing `detox/dist/relay/cli.js` —
 * expected before spec 008 is implemented.
 */
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import type { DetoxServerAddress } from 'detox/client';

import { bearerHeaders, waitUntilListening, type DetoxServerHandle } from './server';

/** A node as the relay's operator would configure it, named for assertions. */
export interface RelayNodeRef {
  /** Operator-chosen name — the spec pins that `details.nodes[].node` echoes it. */
  readonly name: string;
  readonly server: DetoxServerHandle;
}

export interface StartRelayOptions {
  nodes: ReadonlyArray<RelayNodeRef>;
  /** `--keepalive-window` (seconds) for the client hop; `0` is legal. */
  keepaliveWindowSec?: number;
  /** `--blob-budget` (bytes) for the relay's own store. */
  blobBudget?: number;
  /**
   * Point the relay at an existing store root instead of the fresh temp one
   * this helper mints by default. Isolation matters: a spawned relay
   * inherits the same per-user store location as a real one, so without it
   * every `yarn accept 008` would write into — and LRU-evict — the
   * machine's real blob cache (the trap `helpers/server.ts` documents).
   */
  blobRoot?: string;
  /**
   * A fresh temp `DETOX_RELAY_LOG_ROOT` for the relay's own connection log
   * (spec 008) — the same isolation reasoning as `blobRoot`.
   */
  isolatedLogRoot?: boolean;
  /** Extra handshake headers; `Authorization` is supplied automatically. */
  headers?: Readonly<Record<string, string>>;
  readyTimeoutMs?: number;
  /** Aborts the wait (and kills the spawned relay) — pass `t.signal`. */
  signal?: AbortSignal;
}

export interface DetoxRelayHandle extends AsyncDisposable {
  readonly address: DetoxServerAddress;
  readonly url: string;
  /** Everything the relay wrote so far (stdout + stderr, arrival order). */
  logs(): string;
  stop(): Promise<void>;
}

const LOOPBACK = '127.0.0.1';
const DEFAULT_READY_TIMEOUT_MS = 10_000;
const SIGKILL_AFTER_MS = 3_000;
const STDERR_TAIL_CHUNKS = 32;

/** `Bearer <token>` → the token; the relay config wants the raw secret. */
function tokenOf(address: DetoxServerAddress): string {
  const header = Object.entries(address.headers ?? {}).find(
    ([name]) => name.toLowerCase() === 'authorization',
  )?.[1];
  return header?.replace(/^Bearer\s+/i, '') ?? '';
}

/**
 * True once the relay has logged the loss of the named node's connection.
 * The wording is unpinned — the frozen accept file only pins that the loss
 * is logged, naming the node. Matched per line, any word order, so a
 * natural "[relay] lost connection to node mac-a" passes.
 */
export function relayLostNode(logs: string, nodeName: string): boolean {
  return logs
    .split('\n')
    .some(
      (line) =>
        line.includes('[relay]') &&
        line.includes(nodeName) &&
        /(lost|closed|dead|down|unreachable|gone)/i.test(line),
    );
}

/**
 * Which node allocated the given simulator — read off the node's own
 * allocation log line. Node-order is unspecified (spec 008 fixture policy),
 * so tests that must kill "the node holding p1" discover it here instead of
 * assuming placement. Wording is unpinned, same as `relayLostNode`.
 */
export function nodeHolding(
  udid: string,
  nodes: ReadonlyArray<RelayNodeRef>,
): RelayNodeRef {
  // The node's own line at the end of its allocation: `allocateDevice — ready: <id> (booted|warm)` (spec 015).
  const holder = nodes.find((node) => node.server.logs().includes(`allocateDevice — ready: ${udid}`));
  if (!holder) throw new Error(`no configured node's logs claim allocation of ${udid}`);
  return holder;
}

export async function startRelay(options: StartRelayOptions): Promise<DetoxRelayHandle> {
  const token = randomBytes(16).toString('hex');
  const nodesFile = path.join(mkdtempSync(path.join(tmpdir(), 'detox-relay-')), 'nodes.json');
  writeFileSync(
    nodesFile,
    JSON.stringify(
      options.nodes.map(({ name, server }) => ({
        name,
        url: server.url,
        token: tokenOf(server.address),
      })),
    ),
  );

  const cli = path.resolve(process.cwd(), 'detox', 'dist', 'relay', 'cli.js');
  const flags = ['--port', '0', '--host', LOOPBACK, '--nodes', nodesFile];
  if (options.keepaliveWindowSec !== undefined) {
    flags.push('--keepalive-window', String(options.keepaliveWindowSec));
  }
  if (options.blobBudget !== undefined) flags.push('--blob-budget', String(options.blobBudget));

  const blobRoot =
    options.blobRoot ?? mkdtempSync(path.join(tmpdir(), 'detox-relay-blob-store-'));
  const logRoot = options.isolatedLogRoot
    ? mkdtempSync(path.join(tmpdir(), 'detox-relay-log-root-'))
    : undefined;
  const child = spawn('node', [cli, ...flags], {
    // The token goes through the environment, not argv (argv is readable by
    // every process on the machine — the same reasoning as the nodes file).
    env: {
      ...process.env,
      DETOX_RELAY_TOKEN: token,
      DETOX_RELAY_BLOB_ROOT: blobRoot,
      ...(logRoot === undefined ? {} : { DETOX_RELAY_LOG_ROOT: logRoot }),
    },
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
    signal: options.signal,
  });

  // Forwarded live, tagged by pid, same convention as `helpers/server.ts`:
  // a relay's own narration (fan-out attempts, node loss, the log crossing
  // the hop) shows up on the accept run's own combined log.
  const livePrefix = `[relay:${String(child.pid ?? '?')}]`;

  const stderrTail: string[] = [];
  child.stderr?.on('data', (chunk: Buffer) => {
    stderrTail.push(chunk.toString());
    if (stderrTail.length > STDERR_TAIL_CHUNKS) stderrTail.shift();
    process.stderr.write(`${livePrefix} ${chunk.toString()}`);
  });
  const stdoutChunks: string[] = [];
  child.stdout?.on('data', (chunk: Buffer) => {
    stdoutChunks.push(chunk.toString());
    process.stderr.write(`${livePrefix} ${chunk.toString()}`);
  });
  child.on('error', () => {
    /* reported through waitUntilListening, or expected on abort */
  });

  const killOnExit = (): void => {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
  };
  process.once('exit', killOnExit);

  const stop = async (): Promise<void> => {
    process.removeListener('exit', killOnExit);
    // The nodes file holds N node tokens — unlike the server helper's
    // blobRoot (whose survival is a property under test), secrets do not
    // get left to the OS tmp reaper.
    rmSync(path.dirname(nodesFile), { recursive: true, force: true });
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
    url = await waitUntilListening(child, options.readyTimeoutMs ?? DEFAULT_READY_TIMEOUT_MS);
  } catch (error) {
    await stop();
    const stderr = stderrTail.join('').trim();
    throw stderr
      ? new Error(`${String(error)}\n[relay stderr] ${stderr}`, { cause: error })
      : error;
  }

  return {
    address: { url, headers: bearerHeaders(token, options.headers) },
    url,
    logs: (): string => stdoutChunks.join('') + stderrTail.join(''),
    stop,
    [Symbol.asyncDispose]: stop,
  };
}
