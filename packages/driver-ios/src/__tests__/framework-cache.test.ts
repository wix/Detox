import { chmodSync, mkdirSync, mkdtempSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';
import { DetoxError, DetoxErrorCode } from '@detox-remote/core';

import { defaultFrameworkCacheDir, FRAMEWORK_PATH_ENV, resolveIosFrameworkPath } from '../framework-cache';

function makeCacheDir(): string {
  return mkdtempSync(path.join(tmpdir(), 'detox-framework-cache-'));
}

function writeBuild(cacheDir: string, hash: string, mtime: Date): string {
  const frameworkDir = path.join(cacheDir, hash, 'Detox.framework');
  mkdirSync(frameworkDir, { recursive: true });
  const binary = path.join(frameworkDir, 'Detox');
  writeFileSync(binary, hash);
  utimesSync(binary, mtime, mtime);
  return binary;
}

async function refusalFrom(explicit: string | undefined, cacheDir: string): Promise<DetoxError> {
  const err = await resolveIosFrameworkPath(explicit, cacheDir).catch((e: unknown) => e);
  expect(err).toBeInstanceOf(DetoxError);
  expect((err as DetoxError).code).toBe(DetoxErrorCode.DETOX_INTERNAL);
  return err as DetoxError;
}

const unreadableDirs: string[] = [];
afterEach(() => {
  for (const dir of unreadableDirs.splice(0)) chmodSync(dir, 0o700);
});

describe('resolveIosFrameworkPath', () => {
  it('an explicit path that is a file wins over any cache state', async () => {
    const cacheDir = makeCacheDir();
    writeBuild(cacheDir, 'cached', new Date());
    const explicit = writeBuild(makeCacheDir(), 'explicit', new Date());

    await expect(resolveIosFrameworkPath(explicit, cacheDir)).resolves.toBe(explicit);
  });

  /**
   * @issue DTX-6130
   * A set-but-wrong `DETOX_IOS_FRAMEWORK_PATH` refuses rather than
   * silently falling back to the cache — a fallback would mask config
   * drift forever.
   */
  it('an explicit path that does not exist refuses typed instead of falling back', async () => {
    const cacheDir = makeCacheDir();
    writeBuild(cacheDir, 'cached', new Date());
    const missing = path.join(cacheDir, 'no-such', 'Detox.framework', 'Detox');

    const err = await refusalFrom(missing, cacheDir);
    expect(err.message).toContain(missing);
    expect(err.message).toContain(FRAMEWORK_PATH_ENV);
  });

  it('an explicit path that is a DIRECTORY (the .framework folder mistake) refuses typed', async () => {
    const cacheDir = makeCacheDir();
    const binary = writeBuild(cacheDir, 'cached', new Date());
    const frameworkFolder = path.dirname(binary);

    const err = await refusalFrom(frameworkFolder, cacheDir);
    expect(err.message).toContain('not an existing file');
  });

  /**
   * @issue DTX-6131
   * The newest cache entry wins by mtime, not by hash: the hash embeds
   * the Xcode version, and this server cannot recompute v20's build
   * recipe to pick the "right" one directly.
   */
  it('with no explicit path the newest cache build wins; non-file entries are skipped', async () => {
    const cacheDir = makeCacheDir();
    writeBuild(cacheDir, 'older', new Date('2026-01-01T00:00:00Z'));
    const newest = writeBuild(cacheDir, 'newer', new Date('2026-08-01T00:00:00Z'));
    mkdirSync(path.join(cacheDir, 'not-a-build'));
    // A build folder whose `Detox` is itself a directory must not be picked.
    mkdirSync(path.join(cacheDir, 'dir-binary', 'Detox.framework', 'Detox'), { recursive: true });

    await expect(resolveIosFrameworkPath(undefined, cacheDir)).resolves.toBe(newest);
  });

  it('equal mtimes tie-break on the path, not on readdir order', async () => {
    const cacheDir = makeCacheDir();
    const tie = new Date('2026-08-01T00:00:00Z');
    const first = writeBuild(cacheDir, 'aaa', tie);
    writeBuild(cacheDir, 'zzz', tie);

    await expect(resolveIosFrameworkPath(undefined, cacheDir)).resolves.toBe(first);
  });

  it('an absent or empty cache refuses typed, naming the build recipe and the env var', async () => {
    const empty = makeCacheDir();
    for (const cacheDir of [empty, path.join(empty, 'never-created')]) {
      const err = await refusalFrom(undefined, cacheDir);
      expect(err.message).toContain('build-framework-cache');
      expect(err.message).toContain(FRAMEWORK_PATH_ENV);
      expect(err.details).toMatchObject({ frameworkCacheDir: cacheDir });
    }
  });

  /**
   * @issue DTX-6133
   * Only "the cache was never built" (`ENOENT`) reads as an empty
   * cache. Anything else (`EACCES`, `ENOTDIR`, I/O) must not masquerade
   * as "go build it" — that recipe cannot fix a cache the server merely
   * cannot read.
   */
  it('an unreadable cache dir refuses as unreadable, never as "go build it"', async () => {
    const cacheDir = makeCacheDir();
    writeBuild(cacheDir, 'cached', new Date());
    chmodSync(cacheDir, 0o000);
    unreadableDirs.push(cacheDir);

    const err = await refusalFrom(undefined, cacheDir);
    expect(err.message).toContain('cannot be read');
    expect(err.message).not.toContain('build-framework-cache');
  });

  it('the production cache dir is the fixed v20 per-user location', () => {
    expect(
      defaultFrameworkCacheDir().endsWith(path.join('Library', 'Detox', 'ios', 'framework')),
    ).toBe(true);
  });
});
