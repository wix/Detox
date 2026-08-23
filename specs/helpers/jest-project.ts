/**
 * Temp-project scaffolding for spec 010 (editable helper): a jest project
 * shaped like a user's. `writeJestProject` is `writeProject` plus a
 * `node_modules` the fixture can actually resolve from: every top-level
 * entry of the repo's node_modules is symlinked in (jest 30 and its tree
 * among them), and `detox` is not the workspace package but the staged
 * pack — the `scripts/pack-client.js` tarball, unpacked once per accept
 * process — so `testEnvironment: 'detox/runners/jest/testEnvironment'` and
 * its three siblings are proven against the artifact users install, not
 * against workspace source.
 *
 * Receipts: fixture tests write JSON files into the project directory (the
 * spawn contract fixes the runner's cwd to the CLI's own, which is the
 * project), and the accept reads them back here.
 */
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, readdir, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

import { writeProject, type DetoxProject } from './project';
import { waitUntil } from './simctl';

const execFileAsync = promisify(execFile);

const REPO_ROOT = path.resolve(__dirname, '../..');

/**
 * Where the sibling read-only Detox 20 checkout keeps its built example
 * app, reused so accept 010 and `yarn parity` assert against the same
 * binary.
 */
const DEFAULT_EXAMPLE_APP = path.resolve(
  __dirname,
  '../../../Detox/detox/test/ios/build/Build/Products/Release-iphonesimulator/example.app',
);

export function exampleApp(): string {
  const app = process.env.DETOX20_EXAMPLE_APP ?? DEFAULT_EXAMPLE_APP;
  if (!existsSync(app)) {
    throw new Error(
      `the Detox 20 example app is not built at ${app} — build it in the sibling checkout ` +
        '(or point DETOX20_EXAMPLE_APP at a build). A gate that silently skips is not a gate.',
    );
  }
  return app;
}

/** The corpus's own device pin (geometry — same reason as parity). */
export function exampleDevice(): string {
  return process.env.DETOX20_EXAMPLE_DEVICE ?? 'iPhone 17 Pro';
}

/** One pack per accept process: pack → unpack → the installed `package/` dir. */
let stagedPack: Promise<string> | undefined;

export function stagePackedDetox(): Promise<string> {
  stagedPack ??= (async (): Promise<string> => {
    const dest = await mkdtemp(path.join(tmpdir(), 'detox-spec010-pack-'));
    const { stdout } = await execFileAsync('node', [
      path.join(REPO_ROOT, 'scripts', 'pack-client.js'),
      dest,
    ]);
    const tarball = stdout.trim().split('\n').pop();
    if (!tarball) throw new Error('pack-client.js printed no tarball path');
    await execFileAsync('tar', ['-xzf', tarball, '-C', dest]);
    const unpacked = path.join(dest, 'package');
    if (!existsSync(unpacked)) throw new Error(`no package/ dir after unpacking ${tarball}`);
    return unpacked;
  })();
  return stagedPack;
}

/**
 * `writeProject` + the node_modules described in the header. Call sites pass
 * the same `files` record they would pass to `writeProject`.
 */
export async function writeJestProject(
  files: Readonly<Record<string, string | object>>,
): Promise<DetoxProject> {
  const repoModules = path.join(REPO_ROOT, 'node_modules');
  if (!existsSync(path.join(repoModules, 'jest'))) {
    throw new Error(
      'jest is not installed in this repo — spec 010 accepts on jest 30, which the ' +
        'workspace carries as a devDependency.',
    );
  }
  const detoxPack = await stagePackedDetox();
  const project = await writeProject(files);

  const projectModules = path.join(project.dir, 'node_modules');
  await mkdir(projectModules);
  for (const entry of await readdir(repoModules)) {
    if (entry === 'detox' || entry === '.bin') continue;
    await symlink(path.join(repoModules, entry), path.join(projectModules, entry), 'dir');
  }
  await symlink(detoxPack, path.join(projectModules, 'detox'), 'dir');
  // `.bin` is a real dir so the spawn contract's PATH prepend finds a `jest`
  // that belongs to this project; entries still resolve into the repo tree.
  const bin = path.join(projectModules, '.bin');
  await mkdir(bin);
  for (const entry of await readdir(path.join(repoModules, '.bin'))) {
    await symlink(path.join(repoModules, '.bin', entry), path.join(bin, entry));
  }
  return project;
}

/** Reads a JSON receipt a fixture test wrote into the project directory. */
export async function readReceipt<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(file, 'utf8')) as T;
}

/** Polls for a fixture receipt — for tests that interrupt a still-running CLI. */
export async function waitForReceipt<T>(
  file: string,
  options: { signal?: AbortSignal } = {},
): Promise<T> {
  await waitUntil(() => existsSync(file), {
    signal: options.signal,
    description: `fixture receipt at ${file}`,
  });
  return readReceipt<T>(file);
}
