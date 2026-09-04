/**
 * Filesystem-side scaffolding for spec 016 (editable helper): the
 * framework-cache verbs build into `$HOME/Library/Detox/ios`, so every
 * accept test hands the CLI a throwaway `HOME` — the one seam the CLI, the
 * build scripts and the server's resolver all share — and reads the
 * result back through these helpers. The machine's real cache is never
 * touched by the suite.
 */
import { execFile } from 'node:child_process';
import { chmod, mkdir, mkdtemp, readdir, realpath, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);

/** A fresh home directory. Real-pathed: the CLI prints the path it was given. */
export async function scratchHome(): Promise<string> {
  return realpath(await mkdtemp(path.join(tmpdir(), 'detox-spec016-home-')));
}

export interface FrameworkCacheDirs {
  readonly framework: string;
  readonly xcuitest: string;
}

/** v20's documented layout, the public contract the verbs keep. */
export function frameworkCacheOf(home: string): FrameworkCacheDirs {
  const root = path.join(home, 'Library', 'Detox', 'ios');
  return { framework: path.join(root, 'framework'), xcuitest: path.join(root, 'xcuitest-runner') };
}

/** Writes one file under `dir`, creating the parents — a stand-in cache entry. */
export async function seedFile(dir: string, rel: string, content = 'seed'): Promise<string> {
  const target = path.join(dir, rel);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, content);
  return target;
}

export interface CacheArtifact {
  readonly path: string;
  /** The `<hash>` directory name the artifact sits under. */
  readonly entry: string;
  readonly mtimeMs: number;
  readonly ino: number;
}

async function entriesOf(dir: string): Promise<string[]> {
  try {
    return (await readdir(dir)).sort();
  } catch {
    return [];
  }
}

/**
 * Every `<entry>/Detox.framework/Detox` file under the framework cache —
 * the exact shape the server's resolver scans for the newest build.
 */
export async function frameworkBinariesIn(home: string): Promise<CacheArtifact[]> {
  const dir = frameworkCacheOf(home).framework;
  const found: CacheArtifact[] = [];
  for (const entry of await entriesOf(dir)) {
    const binary = path.join(dir, entry, 'Detox.framework', 'Detox');
    try {
      const info = await stat(binary);
      if (info.isFile()) found.push({ path: binary, entry, mtimeMs: info.mtimeMs, ino: info.ino });
    } catch {
      // Not a build folder (a build log, an interrupted build); not an artifact.
    }
  }
  return found;
}

/** Every `*.xctestrun` under the XCUITest runner cache, with its `<entry>`. */
export async function xctestrunsIn(home: string): Promise<CacheArtifact[]> {
  const dir = frameworkCacheOf(home).xcuitest;
  const found: CacheArtifact[] = [];
  for (const entry of await entriesOf(dir)) {
    const { stdout } = await run('find', [path.join(dir, entry), '-name', '*.xctestrun']);
    for (const file of stdout.split('\n').filter((line) => line.length > 0)) {
      const info = await stat(file);
      found.push({ path: file, entry, mtimeMs: info.mtimeMs, ino: info.ino });
    }
  }
  return found;
}

/**
 * A PATH whose `xcodebuild` fails, standing in for a Mac without Xcode.
 * The build scripts detect Xcode by running `xcodebuild -version` and
 * checking the exit status, so a shim that exits non-zero trips exactly the
 * guard a missing Xcode trips — while leaving the rest of PATH intact, which
 * the scripts need (node, shasum, awk, tar).
 */
export async function pathWithoutXcode(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'detox-no-xcode-'));
  const shim = path.join(dir, 'xcodebuild');
  await writeFile(shim, '#!/bin/sh\necho "xcodebuild: not installed" >&2\nexit 1\n');
  await chmod(shim, 0o755);
  return `${dir}:${process.env.PATH ?? ''}`;
}

/** What `file(1)` says about a path — the loader's view of a binary. */
export async function fileKindExternally(file: string): Promise<string> {
  const { stdout } = await run('file', ['-b', file]);
  return stdout.trim();
}

export async function exists(file: string): Promise<boolean> {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

/**
 * The Xcode projects the build scripts drive in a source checkout
 * (`build_local_framework.ios.sh` → `build_framework.ios.sh <project> …`,
 * and the runner's pair). The accept runner runs in this checkout, so those
 * are the builds a test can interrupt; a tarball install extracts prebuilt
 * archives instead.
 */
const XCODEPROJ = {
  framework: path.resolve(__dirname, '../../detox/ios/Detox.xcodeproj'),
  xcuitest: path.resolve(__dirname, '../../detox/ios/DetoxXCUITestRunner/DetoxXCUITestRunner.xcodeproj'),
} as const;

async function parentOf(pid: number): Promise<number | undefined> {
  try {
    const { stdout } = await run('ps', ['-o', 'ppid=', '-p', String(pid)]);
    const ppid = Number.parseInt(stdout.trim(), 10);
    return Number.isFinite(ppid) ? ppid : undefined;
  } catch {
    return undefined;
  }
}

/**
 * The pids of `xcodebuild` processes building one component right now
 * *under* the given CLI process (by argv through `pgrep`, then by walking
 * `ppid` up to the CLI), so a developer's own build of the same project
 * beside the suite is never mistaken for ours. Empty when none. A test
 * that interrupts the CLI must keep the pids it got here and check those
 * afterwards (`isPidAlive`): once the CLI is gone, a surviving build is
 * reparented to pid 1 and this walk can no longer find it.
 */
export async function detoxXcodebuildsUnder(cliPid: number, component: keyof typeof XCODEPROJ): Promise<number[]> {
  let hits: number[] = [];
  try {
    const { stdout } = await run('pgrep', ['-f', `xcodebuild -project ${XCODEPROJ[component]}`]);
    hits = stdout.split('\n').filter((line) => line.length > 0).map((line) => Number.parseInt(line, 10));
  } catch {
    // pgrep exits 1 when nothing matches.
    return [];
  }
  const descendants: number[] = [];
  for (const pid of hits) {
    // xcodebuild → build_framework.ios.sh → build_local_framework.ios.sh → the CLI.
    let cursor: number | undefined = pid;
    for (let depth = 0; depth < 6 && cursor !== undefined && cursor > 1; depth += 1) {
      cursor = await parentOf(cursor);
      if (cursor === cliPid) {
        descendants.push(pid);
        break;
      }
    }
  }
  return descendants;
}
