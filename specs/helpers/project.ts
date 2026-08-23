/**
 * Temp-project scaffolding for spec 009 (editable helper):
 * accept tests write a real project directory — a `.detoxrc.js` /
 * `detox.config.js` / `package.json#detox` file plus whatever else — and
 * spawn the real CLI in it. The config objects stay inline in the accept
 * file (they are the contract under test); this helper only serializes and
 * places them.
 *
 * The probe runner (`probe-runner.cjs`, also editable) is the configured
 * test runner in every fixture: it consumes the runner-side contract where
 * spec 010's jest integration will — reads
 * `DETOX_CONFIG_SNAPSHOT_PATH`, dials the snapshot's server with the
 * snapshot's token through the built client bundle, and writes a receipt the
 * accept assertions read. Receipt paths in configs are relative
 * ('receipt.json') because the spawn contract fixes the runner's cwd to the
 * CLI's own.
 */
import { mkdir, mkdtemp, readFile, realpath, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import type { DetoxServerAddress } from 'detox/internals';

import { waitUntil } from './simctl';

export interface DetoxProject {
  readonly dir: string;
  /** Absolute path of a file inside the project. */
  path(rel: string): string;
}

/**
 * Serialization by extension: a `.js`/`.cjs` value that is an object becomes
 * `module.exports = <json>;` (the common real-world config form); everything
 * else that is an object becomes plain JSON; strings are written verbatim.
 */
function serialize(filename: string, value: string | object): string {
  if (typeof value === 'string') return value;
  const json = JSON.stringify(value, null, 2);
  return filename.endsWith('.js') || filename.endsWith('.cjs')
    ? `module.exports = ${json};\n`
    : `${json}\n`;
}

export async function writeProject(
  files: Readonly<Record<string, string | object>>,
): Promise<DetoxProject> {
  // realpath: macOS tmpdir lives behind the /var → /private/var symlink, and
  // a child process reports its cwd resolved — assertions that compare
  // `receipt.cwd` / resolved binary paths against `project.dir` would
  // otherwise fail on the symlink alone.
  const dir = await realpath(await mkdtemp(path.join(tmpdir(), 'detox-spec009-project-')));
  for (const [rel, value] of Object.entries(files)) {
    const target = path.join(dir, rel);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, serialize(path.basename(rel), value));
  }
  return { dir, path: (rel: string): string => path.join(dir, rel) };
}

/** Absolute path of the probe runner script. */
const PROBE_RUNNER = path.resolve(__dirname, 'probe-runner.cjs');

/**
 * The `$0` string configs use as their test runner. Multi-word: v20's `$0`
 * contract ('nyc jest') split on whitespace, kept by spec 009 — so this
 * path must never contain spaces (it lives in the repo, it does not).
 */
export function probeCommand(): string {
  return `node ${PROBE_RUNNER}`;
}

/** The snapshot as the probe saw it — spec 009's 009↔010 seam, loosely typed. */
export interface ProbeSnapshotView {
  readonly configurationName: string;
  /** `token` only when one is configured — auth is opt-in and off (#62). */
  readonly client: { readonly server: string; readonly token?: string } & Record<string, unknown>;
  readonly apps: readonly ({
    readonly name: string;
    /** Optional in the config (#63) — never invented by the snapshot. */
    readonly bundleId?: string;
    readonly binaryPath?: string;
  } & Record<string, unknown>)[];
  readonly device: { readonly type: string; readonly query: Record<string, unknown> };
  readonly [key: string]: unknown;
}

export interface ProbeReceipt {
  readonly pid: number;
  readonly cwd: string;
  /** Everything after `node probe-runner.cjs` — configured args, then forwarded. */
  readonly argv: readonly string[];
  readonly snapshot: ProbeSnapshotView;
  /** Where the snapshot file lived — the accept asserts it is deleted post-run. */
  readonly snapshotPath: string;
  /** DETOX_CONFIGURATION as the runner saw it (the variable the CLI exports to its runner). */
  readonly configurationEnv?: string;
  /** Whether the probe's dial of snapshot.client.server (with its token, if any) succeeded. */
  readonly initOk: boolean;
  readonly initErrorCode?: number;
  readonly initErrorMessage?: string;
}

export async function readProbeReceipt(file: string): Promise<ProbeReceipt> {
  return JSON.parse(await readFile(file, 'utf8')) as ProbeReceipt;
}

/**
 * Polls for the receipt (the probe writes it atomically — temp + rename), for
 * the park test where the CLI is still running when the receipt appears.
 */
export async function waitForProbeReceipt(
  file: string,
  options: { signal?: AbortSignal } = {},
): Promise<ProbeReceipt> {
  await waitUntil(() => existsSync(file), {
    signal: options.signal,
    description: `probe receipt at ${file}`,
  });
  return readProbeReceipt(file);
}

/** Extracts the bearer token a server/relay helper handle carries in its address. */
export function tokenOf(address: DetoxServerAddress): string {
  const headers = address.headers ?? {};
  const auth = Object.entries(headers).find(([key]) => key.toLowerCase() === 'authorization')?.[1];
  const token = auth?.replace(/^Bearer /, '');
  if (!token) throw new Error('address carries no bearer token — use a dedicated server handle');
  return token;
}

/** An address for `init` from a raw URL + token, the way a config carries them. */
export function bearerAddress(url: string, token: string): DetoxServerAddress {
  return { url, headers: { Authorization: `Bearer ${token}` } };
}

/** Signal-0 liveness probe: is this pid still running? */
export function isPidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}
