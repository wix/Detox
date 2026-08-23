/**
 * The framework-cache verbs: `detox build-framework-cache`,
 * `detox clean-framework-cache` and `detox rebuild-framework-cache`
 * (ported from v20 `local-cli/utils/frameworkUtils.js`).
 *
 * The server injects the Detox framework from the per-user cache
 * (`~/Library/Detox/ios/framework/<hash>/`, see the server's
 * framework-cache resolution); the XCUITest runner has its own cache next
 * to it. Both are produced by the package's own shell scripts, which this
 * module only locates and runs. macOS only: elsewhere the verbs are a no-op
 * with a notice, as in v20.
 */
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

import { UsageError } from './errors';

export type FrameworkCacheVerb = 'build-framework-cache' | 'clean-framework-cache' | 'rebuild-framework-cache';

export const FRAMEWORK_CACHE_VERBS: readonly FrameworkCacheVerb[] = [
  'build-framework-cache',
  'clean-framework-cache',
  'rebuild-framework-cache',
];

export function isFrameworkCacheVerb(verb: string): verb is FrameworkCacheVerb {
  return (FRAMEWORK_CACHE_VERBS as readonly string[]).includes(verb);
}

export interface FrameworkCacheSelection {
  /** The injected Detox library. */
  framework: boolean;
  /** The XCUITest test runner. */
  xcuitest: boolean;
}

/**
 * v20's flag contract: `--detox` and `--xcuitest` each select one component;
 * with neither, both are selected. Anything else is a usage refusal.
 */
export function parseFrameworkCacheArgs(verb: FrameworkCacheVerb, argv: readonly string[]): FrameworkCacheSelection {
  let framework = false;
  let xcuitest = false;
  for (const arg of argv) {
    if (arg === '--detox') framework = true;
    else if (arg === '--xcuitest') xcuitest = true;
    else {
      throw new UsageError(
        `Unknown argument for \`detox ${verb}\`: ${arg} — the verb takes only --detox and --xcuitest`,
      );
    }
  }
  if (!framework && !xcuitest) return { framework: true, xcuitest: true };
  return { framework, xcuitest };
}

export interface FrameworkCachePaths {
  frameworkDir: string;
  xcuitestDir: string;
  frameworkScript: string;
  xcuitestScript: string;
}

/** v20's fixed per-user cache. `home` is a test seam. */
export function frameworkCacheDirs(home: string = homedir()): Pick<FrameworkCachePaths, 'frameworkDir' | 'xcuitestDir'> {
  const root = path.join(home, 'Library', 'Detox', 'ios');
  return { frameworkDir: path.join(root, 'framework'), xcuitestDir: path.join(root, 'xcuitest-runner') };
}

/**
 * The build scripts ship under `detox/scripts`. From the built bin
 * (`detox/dist/cli/detox.js`) that is two levels up; from this source file
 * (tsx, the accept suite) it is the repo's `detox/scripts`.
 */
export function locateBuildScripts(fromDir: string): Pick<FrameworkCachePaths, 'frameworkScript' | 'xcuitestScript'> {
  const candidates = [path.resolve(fromDir, '../../scripts'), path.resolve(fromDir, '../../../detox/scripts')];
  const scriptsDir = candidates.find((dir) => existsSync(path.join(dir, 'build_local_framework.ios.sh')));
  if (scriptsDir === undefined) {
    throw new UsageError(`detox: the framework build scripts were not found next to the CLI (looked in ${candidates.join(', ')})`);
  }
  return {
    frameworkScript: path.join(scriptsDir, 'build_local_framework.ios.sh'),
    xcuitestScript: path.join(scriptsDir, 'build_local_xcuitest.ios.sh'),
  };
}

export interface FrameworkCacheIo {
  platform: NodeJS.Platform;
  /** Runs a build script with inherited stdio; resolves with its exit code. */
  runScript: (script: string) => Promise<number>;
  /** Removes a directory tree; absence is not an error. */
  removeDir: (dir: string) => Promise<void>;
  log: (line: string) => void;
}

/** A component name for the log lines, as v20 spelled them. */
const DESCRIPTOR = { framework: 'Detox framework', xcuitest: 'XCUITest runner' } as const;

export async function cleanFrameworkCache(
  selection: FrameworkCacheSelection,
  paths: Pick<FrameworkCachePaths, 'frameworkDir' | 'xcuitestDir'>,
  io: FrameworkCacheIo,
): Promise<void> {
  if (io.platform !== 'darwin') {
    io.log('detox: the framework cache is macOS-only — nothing to do on this platform.');
    return;
  }
  for (const [key, dir] of [['framework', paths.frameworkDir], ['xcuitest', paths.xcuitestDir]] as const) {
    if (!selection[key]) continue;
    io.log(`detox: cleaning the ${DESCRIPTOR[key]} cache at ${dir}`);
    await io.removeDir(dir);
  }
}

/** Resolves with the first non-zero script exit code, or 0. */
export async function buildFrameworkCache(
  selection: FrameworkCacheSelection,
  paths: FrameworkCachePaths,
  io: FrameworkCacheIo,
): Promise<number> {
  if (io.platform !== 'darwin') {
    io.log('detox: the framework cache is macOS-only — nothing to do on this platform.');
    return 0;
  }
  const steps = [
    ['framework', paths.frameworkDir, paths.frameworkScript],
    ['xcuitest', paths.xcuitestDir, paths.xcuitestScript],
  ] as const;
  for (const [key, dir, script] of steps) {
    if (!selection[key]) continue;
    io.log(`detox: building the ${DESCRIPTOR[key]} cache at ${dir}`);
    const code = await io.runScript(script);
    if (code !== 0) {
      io.log(`detox: building the ${DESCRIPTOR[key]} failed (exit ${String(code)})`);
      return code;
    }
  }
  return 0;
}

export async function runFrameworkCacheVerb(
  verb: FrameworkCacheVerb,
  selection: FrameworkCacheSelection,
  paths: FrameworkCachePaths,
  io: FrameworkCacheIo,
): Promise<number> {
  if (verb === 'clean-framework-cache' || verb === 'rebuild-framework-cache') {
    await cleanFrameworkCache(selection, paths, io);
  }
  if (verb === 'build-framework-cache' || verb === 'rebuild-framework-cache') {
    return buildFrameworkCache(selection, paths, io);
  }
  return 0;
}
