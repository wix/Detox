import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { UsageError } from '../errors';
import {
  buildFrameworkCache,
  cleanFrameworkCache,
  frameworkCacheDirs,
  isFrameworkCacheVerb,
  locateBuildScripts,
  parseFrameworkCacheArgs,
  runFrameworkCacheVerb,
  type FrameworkCacheIo,
  type FrameworkCachePaths,
} from '../framework-cache';

const PATHS: FrameworkCachePaths = {
  frameworkDir: '/cache/framework',
  xcuitestDir: '/cache/xcuitest-runner',
  frameworkScript: '/scripts/build_local_framework.ios.sh',
  xcuitestScript: '/scripts/build_local_xcuitest.ios.sh',
};

function fakeIo(platform: NodeJS.Platform = 'darwin', failing?: string): FrameworkCacheIo & {
  ran: string[];
  removed: string[];
  lines: string[];
} {
  const io = {
    platform,
    ran: [] as string[],
    removed: [] as string[],
    lines: [] as string[],
    runScript: async (script: string) => {
      io.ran.push(script);
      return script === failing ? 65 : 0;
    },
    removeDir: async (dir: string) => {
      io.removed.push(dir);
    },
    log: (line: string) => {
      io.lines.push(line);
    },
  };
  return io;
}

describe('isFrameworkCacheVerb', () => {
  it('names the three verbs and nothing else', () => {
    expect(isFrameworkCacheVerb('build-framework-cache')).toBe(true);
    expect(isFrameworkCacheVerb('clean-framework-cache')).toBe(true);
    expect(isFrameworkCacheVerb('rebuild-framework-cache')).toBe(true);
    expect(isFrameworkCacheVerb('test')).toBe(false);
  });
});

describe('parseFrameworkCacheArgs', () => {
  it('selects both components with no flags', () => {
    expect(parseFrameworkCacheArgs('build-framework-cache', [])).toEqual({ framework: true, xcuitest: true });
  });

  it('selects one component per flag', () => {
    expect(parseFrameworkCacheArgs('build-framework-cache', ['--detox'])).toEqual({ framework: true, xcuitest: false });
    expect(parseFrameworkCacheArgs('clean-framework-cache', ['--xcuitest'])).toEqual({ framework: false, xcuitest: true });
    expect(parseFrameworkCacheArgs('clean-framework-cache', ['--xcuitest', '--detox'])).toEqual({ framework: true, xcuitest: true });
  });

  it('refuses any other token with a usage error naming it', () => {
    expect(() => parseFrameworkCacheArgs('build-framework-cache', ['--android'])).toThrow(UsageError);
    expect(() => parseFrameworkCacheArgs('build-framework-cache', ['--android'])).toThrow(/--android/);
  });
});

describe('frameworkCacheDirs', () => {
  it("is v20's fixed per-user layout under ~/Library/Detox/ios", () => {
    expect(frameworkCacheDirs('/home/u')).toEqual({
      frameworkDir: path.join('/home/u', 'Library', 'Detox', 'ios', 'framework'),
      xcuitestDir: path.join('/home/u', 'Library', 'Detox', 'ios', 'xcuitest-runner'),
    });
  });
});

describe('locateBuildScripts', () => {
  const dirs: string[] = [];
  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  it('finds the scripts two levels above the built bin', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'detox-fc-'));
    dirs.push(root);
    mkdirSync(path.join(root, 'scripts'), { recursive: true });
    mkdirSync(path.join(root, 'dist', 'cli'), { recursive: true });
    writeFileSync(path.join(root, 'scripts', 'build_local_framework.ios.sh'), '');
    const found = locateBuildScripts(path.join(root, 'dist', 'cli'));
    expect(found.frameworkScript).toBe(path.join(root, 'scripts', 'build_local_framework.ios.sh'));
    expect(found.xcuitestScript).toBe(path.join(root, 'scripts', 'build_local_xcuitest.ios.sh'));
  });

  it('finds the scripts from the source tree as well', () => {
    expect(locateBuildScripts(__dirname.replace(/__tests__$/, ''))).toEqual({
      frameworkScript: path.resolve(__dirname, '../../../../detox/scripts/build_local_framework.ios.sh'),
      xcuitestScript: path.resolve(__dirname, '../../../../detox/scripts/build_local_xcuitest.ios.sh'),
    });
  });

  it('refuses when no scripts directory is found', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'detox-fc-'));
    dirs.push(root);
    expect(() => locateBuildScripts(path.join(root, 'a', 'b'))).toThrow(UsageError);
  });
});

describe('cleanFrameworkCache', () => {
  it('removes the selected cache directories', async () => {
    const io = fakeIo();
    await cleanFrameworkCache({ framework: true, xcuitest: false }, PATHS, io);
    expect(io.removed).toEqual([PATHS.frameworkDir]);
    await cleanFrameworkCache({ framework: true, xcuitest: true }, PATHS, io);
    expect(io.removed).toEqual([PATHS.frameworkDir, PATHS.frameworkDir, PATHS.xcuitestDir]);
  });

  it('is a logged no-op off macOS', async () => {
    const io = fakeIo('linux');
    await cleanFrameworkCache({ framework: true, xcuitest: true }, PATHS, io);
    expect(io.removed).toEqual([]);
    expect(io.lines.join('\n')).toMatch(/macOS-only/);
  });
});

describe('buildFrameworkCache', () => {
  it('runs the selected build scripts in order and resolves 0', async () => {
    const io = fakeIo();
    await expect(buildFrameworkCache({ framework: true, xcuitest: true }, PATHS, io)).resolves.toBe(0);
    expect(io.ran).toEqual([PATHS.frameworkScript, PATHS.xcuitestScript]);
  });

  it('stops at the first failing script and resolves its exit code', async () => {
    const io = fakeIo('darwin', PATHS.frameworkScript);
    await expect(buildFrameworkCache({ framework: true, xcuitest: true }, PATHS, io)).resolves.toBe(65);
    expect(io.ran).toEqual([PATHS.frameworkScript]);
    expect(io.lines.join('\n')).toMatch(/failed \(exit 65\)/);
  });

  it('is a logged no-op off macOS', async () => {
    const io = fakeIo('win32');
    await expect(buildFrameworkCache({ framework: true, xcuitest: true }, PATHS, io)).resolves.toBe(0);
    expect(io.ran).toEqual([]);
  });
});

describe('runFrameworkCacheVerb', () => {
  it('clean removes, build runs, rebuild does both', async () => {
    const all = { framework: true, xcuitest: true };
    const clean = fakeIo();
    await expect(runFrameworkCacheVerb('clean-framework-cache', all, PATHS, clean)).resolves.toBe(0);
    expect(clean.removed).toHaveLength(2);
    expect(clean.ran).toHaveLength(0);

    const build = fakeIo();
    await expect(runFrameworkCacheVerb('build-framework-cache', all, PATHS, build)).resolves.toBe(0);
    expect(build.removed).toHaveLength(0);
    expect(build.ran).toHaveLength(2);

    const rebuild = fakeIo();
    await expect(runFrameworkCacheVerb('rebuild-framework-cache', all, PATHS, rebuild)).resolves.toBe(0);
    expect(rebuild.removed).toHaveLength(2);
    expect(rebuild.ran).toHaveLength(2);
  });
});
