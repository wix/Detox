/**
 * The framework-cache verbs (spec 016): `detox build-framework-cache`,
 * `detox clean-framework-cache` and `detox rebuild-framework-cache`
 * (ported from v20 `local-cli/utils/frameworkUtils.js`).
 *
 * The server injects the Detox framework from the per-user cache
 * (`~/Library/Detox/ios/framework/<hash>/Detox.framework/Detox` — the
 * newest build wins, see the iOS driver's `framework-cache.ts`); the
 * XCUITest runner has its own cache next to it. Both are produced by the
 * package's own shell scripts (`scripts/build_local_framework.ios.sh`,
 * `scripts/build_local_xcuitest.ios.sh`), which this module only locates
 * and runs: the hash, the skip-when-present rule and the Xcode check are
 * the scripts', and stay theirs. macOS only: elsewhere the verbs are a
 * logged no-op, as in v20.
 *
 * Pure composition: paths in, an exit code out, every side effect behind
 * `FrameworkCacheIo`. The process shell (`main.ts`) owns stdio, signals and
 * `process.exit`.
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

export type FrameworkCacheArgs =
  | { readonly help: true }
  | { readonly help: false; readonly selection: FrameworkCacheSelection };

const VERB_ACTION: Record<FrameworkCacheVerb, string> = {
  'build-framework-cache': 'Builds',
  'clean-framework-cache': 'Removes',
  'rebuild-framework-cache': 'Removes and rebuilds',
};

const VERB_NOTE: Record<FrameworkCacheVerb, string> = {
  'build-framework-cache':
    'A component already built for this Detox and Xcode version is skipped;\n' +
    '`detox rebuild-framework-cache` is the way to force a fresh one.',
  'clean-framework-cache': 'A cache that does not exist is nothing to do, not an error.',
  'rebuild-framework-cache': 'Nothing is skipped: the selected caches are removed first, then built.',
};

/** The verb's own `--help`, v20's option descriptions kept. */
export function frameworkCacheUsage(verb: FrameworkCacheVerb): string {
  return `
Usage: detox ${verb} [--detox] [--xcuitest]

${VERB_ACTION[verb]} the cached Detox framework and XCUITest runner under
~/Library/Detox/ios. macOS only: on other platforms the command prints a
notice and does nothing.

  --detox     only the injected Detox library (~/Library/Detox/ios/framework)
  --xcuitest  only the XCUITest test runner (~/Library/Detox/ios/xcuitest-runner)

With neither flag, both are selected. ${VERB_NOTE[verb]}
`;
}

/**
 * v20's flag contract: `--detox` and `--xcuitest` each select one component;
 * with neither, both are selected. `--help`/`-h` is the verb's usage.
 * Anything else is a usage refusal naming the token.
 */
export function parseFrameworkCacheArgs(verb: FrameworkCacheVerb, argv: readonly string[]): FrameworkCacheArgs {
  if (argv.includes('--help') || argv.includes('-h')) return { help: true };
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
  if (!framework && !xcuitest) return { help: false, selection: { framework: true, xcuitest: true } };
  return { help: false, selection: { framework, xcuitest } };
}

export interface FrameworkCacheDirs {
  frameworkDir: string;
  xcuitestDir: string;
}

export interface FrameworkCacheScripts {
  frameworkScript: string;
  xcuitestScript: string;
}

export type FrameworkCachePaths = FrameworkCacheDirs & FrameworkCacheScripts;

/**
 * v20's fixed per-user cache. `home` is a test seam; production passes
 * nothing, and `homedir()` honours `HOME`, which is also what the build
 * scripts and the server's resolver read — one variable moves all three.
 */
export function frameworkCacheDirs(home: string = homedir()): FrameworkCacheDirs {
  const root = path.join(home, 'Library', 'Detox', 'ios');
  return { frameworkDir: path.join(root, 'framework'), xcuitestDir: path.join(root, 'xcuitest-runner') };
}

/**
 * The build scripts ship under `detox/scripts` (the package's `files`
 * list). From the built bin (`detox/dist/cli/detox.js`) that is two levels
 * up; from this source file (tsx) it is the repo's `detox/scripts`.
 */
export function locateBuildScripts(fromDir: string): FrameworkCacheScripts {
  // Deduplicated: in an installed layout both resolve to the same directory.
  const candidates = [...new Set([path.resolve(fromDir, '../../scripts'), path.resolve(fromDir, '../../../detox/scripts')])];
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
  /**
   * Runs a build script with inherited stdio; resolves with its exit code
   * (non-zero for a signal death). Rejects only when the script could not
   * be started at all.
   */
  runScript: (script: string) => Promise<number>;
  /** Removes a directory tree; absence is not an error. */
  removeDir: (dir: string) => Promise<void>;
  /**
   * One line of the verb's own narration. Awaited before the next side
   * effect: the process shell writes with a callback, so the line lands
   * on a pipe before the script it announces starts writing to the same fd.
   */
  log: (line: string) => void | Promise<void>;
}

/** A component name for the log lines, as v20 spelled them. */
const DESCRIPTOR = { framework: 'Detox framework', xcuitest: 'XCUITest runner' } as const;

const NOT_MACOS = 'detox: the framework cache is macOS-only — nothing to do on this platform.';

export async function cleanFrameworkCache(
  selection: FrameworkCacheSelection,
  paths: FrameworkCacheDirs,
  io: FrameworkCacheIo,
): Promise<void> {
  for (const [key, dir] of [['framework', paths.frameworkDir], ['xcuitest', paths.xcuitestDir]] as const) {
    if (!selection[key]) continue;
    await io.log(`detox: cleaning the ${DESCRIPTOR[key]} cache at ${dir}`);
    await io.removeDir(dir);
  }
}

/** Resolves with the first non-zero script exit code, or 0. */
export async function buildFrameworkCache(
  selection: FrameworkCacheSelection,
  paths: FrameworkCachePaths,
  io: FrameworkCacheIo,
): Promise<number> {
  const steps = [
    ['framework', paths.frameworkDir, paths.frameworkScript],
    ['xcuitest', paths.xcuitestDir, paths.xcuitestScript],
  ] as const;
  for (const [key, dir, script] of steps) {
    if (!selection[key]) continue;
    await io.log(`detox: building the ${DESCRIPTOR[key]} cache at ${dir}`);
    const code = await io.runScript(script);
    if (code !== 0) {
      await io.log(`detox: building the ${DESCRIPTOR[key]} failed (exit ${String(code)})`);
      return code;
    }
  }
  return 0;
}

/**
 * The verb's whole conduct. Off macOS every verb is the one notice and exit
 * 0. The build scripts are looked up lazily — `clean` never needs them, so
 * an install without them can still clean — and, for `rebuild`, before its
 * clean half runs: a lookup that fails must refuse with the cache intact.
 */
export async function runFrameworkCacheVerb(
  verb: FrameworkCacheVerb,
  selection: FrameworkCacheSelection,
  dirs: FrameworkCacheDirs,
  locateScripts: () => FrameworkCacheScripts,
  io: FrameworkCacheIo,
): Promise<number> {
  if (io.platform !== 'darwin') {
    await io.log(NOT_MACOS);
    return 0;
  }
  if (verb === 'clean-framework-cache') {
    await cleanFrameworkCache(selection, dirs, io);
    return 0;
  }
  const paths = { ...dirs, ...locateScripts() };
  if (verb === 'rebuild-framework-cache') {
    await cleanFrameworkCache(selection, paths, io);
  }
  return buildFrameworkCache(selection, paths, io);
}
