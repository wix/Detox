import { readdir, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';

import { DetoxError, DetoxErrorCode } from '@detox-remote/core';

/**
 * The injectable Detox framework — resolution and its typed refusal
 * (ported from v20 `IosSimulatorEnvValidator.js`, which threw the same
 * instructive error at run start; here it moves to the launch verb, the one
 * place a helper-mode tester is guaranteed to see it — the detached helper's
 * stdout is discarded, so a server-side startup complaint reaches nobody).
 *
 * Detox iOS apps never link the framework: the server injects the dylib at
 * launch via `SIMCTL_CHILD_DYLD_INSERT_LIBRARIES`. An uninstrumented launch
 * fails silently — the app runs but never dials in, and `launchApp` hangs
 * until the runner's own clock kills it with zero Detox output.
 *
 * Resolution order:
 *  1. an explicit path (the env var) wins, but must be an existing file.
 *     @issue DTX-6130: a set-but-wrong override refuses rather than silently falling back.
 *  2. otherwise the newest entry in v20's own per-user build cache
 *     (`~/Library/Detox/ios/framework/<hash>/Detox.framework/Detox`, built
 *     by v20's postinstall / `detox build-framework-cache`).
 *     @issue DTX-6131: newest by mtime, since the hash embeds the Xcode version and this server cannot recompute v20's recipe.
 *     equal mtimes tie-break on the path, so the pick never depends on `readdir` order.
 *  3. nothing found → the typed refusal below, naming both fixes.
 *
 * Called by `DetoxServerImpl` before any launch side effect — before payload
 * files, before terminate-first, before `cleanBoot` is forfeited — and
 * re-resolved on every launch: building the cache mid-session starts
 * working on the next `launchApp`, no server restart required.
 */

export const FRAMEWORK_PATH_ENV = 'DETOX_IOS_FRAMEWORK_PATH';

const BUILD_RECIPE = 'detox clean-framework-cache && detox build-framework-cache';

/** v20's fixed per-user cache. Computed per call: `HOME` is a test seam. */
export function defaultFrameworkCacheDir(): string {
  return path.join(homedir(), 'Library', 'Detox', 'ios', 'framework');
}

async function isFile(candidate: string): Promise<boolean> {
  try {
    return (await stat(candidate)).isFile();
  } catch {
    return false;
  }
}

/**
 * Resolves the framework binary to inject, or throws the typed refusal.
 * `cacheDir` is a test seam; production always scans the fixed per-user
 * cache.
 */
export async function resolveIosFrameworkPath(
  explicit: string | undefined,
  cacheDir: string = defaultFrameworkCacheDir(),
): Promise<string> {
  if (explicit !== undefined) {
    if (!(await isFile(explicit))) {
      throw new DetoxError(
        `${FRAMEWORK_PATH_ENV} points at ${explicit}, which is not an existing file — point it at ` +
          `a Detox.framework/Detox binary (the framework's inner Mach-O, not the .framework folder), ` +
          `or unset the variable to use the newest build in ${cacheDir}`,
        {
          code: DetoxErrorCode.DETOX_INTERNAL,
          details: { frameworkPath: explicit, envVar: FRAMEWORK_PATH_ENV, frameworkCacheDir: cacheDir },
        },
      );
    }
    return explicit;
  }

  let entries: string[] = [];
  try {
    entries = await readdir(cacheDir);
  } catch (err) {
    // @issue DTX-6133: only "the cache was never built" reads as empty — anything else must not masquerade as "go build it".
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw new DetoxError(
        `the Detox framework cache at ${cacheDir} cannot be read ` +
          `(${(err as NodeJS.ErrnoException).code ?? String(err)}) — fix its permissions, or point ` +
          `${FRAMEWORK_PATH_ENV} at a Detox.framework/Detox binary`,
        {
          code: DetoxErrorCode.DETOX_INTERNAL,
          details: { frameworkCacheDir: cacheDir, envVar: FRAMEWORK_PATH_ENV },
          cause: err,
        },
      );
    }
  }
  const candidates: Array<{ binary: string; mtimeMs: number }> = [];
  for (const entry of entries) {
    const binary = path.join(cacheDir, entry, 'Detox.framework', 'Detox');
    try {
      const info = await stat(binary);
      if (info.isFile()) candidates.push({ binary, mtimeMs: info.mtimeMs });
    } catch {
      // Not a framework build folder; ignore.
    }
  }
  candidates.sort((a, b) => b.mtimeMs - a.mtimeMs || a.binary.localeCompare(b.binary));
  const newest = candidates[0];
  if (newest === undefined) {
    throw new DetoxError(
      'the Detox framework is not on this server, so launchApp cannot instrument the app — ' +
        `no framework build found in ${cacheDir} and ${FRAMEWORK_PATH_ENV} is not set. ` +
        `Build the cache from a Detox 20 install (\`${BUILD_RECIPE}\`), or point ` +
        `${FRAMEWORK_PATH_ENV} at a Detox.framework/Detox binary and restart the server`,
      {
        code: DetoxErrorCode.DETOX_INTERNAL,
        details: { frameworkCacheDir: cacheDir, envVar: FRAMEWORK_PATH_ENV, buildRecipe: BUILD_RECIPE },
      },
    );
  }
  return newest.binary;
}
