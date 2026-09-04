import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { UsageError } from '../errors';
import {
  FRAMEWORK_CACHE_VERBS,
  buildFrameworkCache,
  cleanFrameworkCache,
  frameworkCacheDirs,
  frameworkCacheUsage,
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

/**
 * Every side effect lands in `events`, in order, so a test can pin that a
 * narration line is awaited before the script it announces starts.
 */
function fakeIo(platform: NodeJS.Platform = 'darwin', failing?: string): FrameworkCacheIo & {
  ran: string[];
  removed: string[];
  lines: string[];
  events: string[];
} {
  const io = {
    platform,
    ran: [] as string[],
    removed: [] as string[],
    lines: [] as string[],
    events: [] as string[],
    runScript: async (script: string) => {
      io.ran.push(script);
      io.events.push(`run ${script}`);
      return script === failing ? 65 : 0;
    },
    removeDir: async (dir: string) => {
      io.removed.push(dir);
      io.events.push(`rm ${dir}`);
    },
    // Deliberately slow: a bare `console.log`-style sink would resolve at
    // once and hide a missing `await` in the module.
    log: (line: string) =>
      new Promise<void>((resolve) => {
        setTimeout(() => {
          io.lines.push(line);
          io.events.push(`log ${line}`);
          resolve();
        }, 1);
      }),
  };
  return io;
}

describe('isFrameworkCacheVerb', () => {
  it('names the three verbs and nothing else', () => {
    for (const verb of FRAMEWORK_CACHE_VERBS) expect(isFrameworkCacheVerb(verb)).toBe(true);
    expect(isFrameworkCacheVerb('test')).toBe(false);
    expect(isFrameworkCacheVerb('framework-cache')).toBe(false);
  });
});

describe('parseFrameworkCacheArgs', () => {
  it('selects both components with no flags', () => {
    expect(parseFrameworkCacheArgs('build-framework-cache', [])).toEqual({
      help: false,
      selection: { framework: true, xcuitest: true },
    });
  });

  it('selects one component per flag', () => {
    expect(parseFrameworkCacheArgs('build-framework-cache', ['--detox'])).toEqual({
      help: false,
      selection: { framework: true, xcuitest: false },
    });
    expect(parseFrameworkCacheArgs('clean-framework-cache', ['--xcuitest'])).toEqual({
      help: false,
      selection: { framework: false, xcuitest: true },
    });
    expect(parseFrameworkCacheArgs('clean-framework-cache', ['--xcuitest', '--detox'])).toEqual({
      help: false,
      selection: { framework: true, xcuitest: true },
    });
  });

  it('answers --help and -h with the usage, whatever else is on the line', () => {
    expect(parseFrameworkCacheArgs('build-framework-cache', ['--help'])).toEqual({ help: true });
    expect(parseFrameworkCacheArgs('rebuild-framework-cache', ['--detox', '-h'])).toEqual({ help: true });
    expect(parseFrameworkCacheArgs('clean-framework-cache', ['--android', '--help'])).toEqual({ help: true });
  });

  it('refuses any other token with a usage error naming it', () => {
    expect(() => parseFrameworkCacheArgs('build-framework-cache', ['--android'])).toThrow(UsageError);
    expect(() => parseFrameworkCacheArgs('build-framework-cache', ['--android'])).toThrow(/--android/);
    expect(() => parseFrameworkCacheArgs('clean-framework-cache', ['--detox', 'extra'])).toThrow(/extra/);
  });
});

describe('frameworkCacheUsage', () => {
  it('names the verb, both flags and the cache root, per verb', () => {
    for (const verb of FRAMEWORK_CACHE_VERBS) {
      const usage = frameworkCacheUsage(verb);
      expect(usage).toContain(`detox ${verb} [--detox] [--xcuitest]`);
      expect(usage).toContain('--detox');
      expect(usage).toContain('--xcuitest');
      expect(usage).toContain('~/Library/Detox/ios');
    }
    expect(frameworkCacheUsage('clean-framework-cache')).toMatch(/^Removes the cached/m);
    expect(frameworkCacheUsage('rebuild-framework-cache')).toMatch(/^Removes and rebuilds/m);
  });

  it('explains skipping only where it happens', () => {
    expect(frameworkCacheUsage('build-framework-cache')).toContain('is skipped');
    expect(frameworkCacheUsage('build-framework-cache')).toContain('detox rebuild-framework-cache');
    expect(frameworkCacheUsage('rebuild-framework-cache')).toContain('Nothing is skipped');
    expect(frameworkCacheUsage('clean-framework-cache')).not.toMatch(/skip/);
    expect(frameworkCacheUsage('clean-framework-cache')).toContain('not an error');
  });
});

describe('frameworkCacheDirs', () => {
  it("is v20's fixed per-user layout under ~/Library/Detox/ios", () => {
    expect(frameworkCacheDirs('/home/u')).toEqual({
      frameworkDir: path.join('/home/u', 'Library', 'Detox', 'ios', 'framework'),
      xcuitestDir: path.join('/home/u', 'Library', 'Detox', 'ios', 'xcuitest-runner'),
    });
  });

  it('defaults to the real home directory', () => {
    expect(frameworkCacheDirs().frameworkDir).toMatch(/Library\/Detox\/ios\/framework$/);
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

  it('refuses when no scripts directory is found, naming where it looked', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'detox-fc-'));
    dirs.push(root);
    expect(() => locateBuildScripts(path.join(root, 'a', 'b'))).toThrow(UsageError);
    expect(() => locateBuildScripts(path.join(root, 'a', 'b'))).toThrow(path.join(root, 'scripts'));
  });
});

describe('cleanFrameworkCache', () => {
  it('removes the selected cache directories, announcing each first', async () => {
    const io = fakeIo();
    await cleanFrameworkCache({ framework: true, xcuitest: false }, PATHS, io);
    expect(io.removed).toEqual([PATHS.frameworkDir]);
    expect(io.events).toEqual([`log detox: cleaning the Detox framework cache at ${PATHS.frameworkDir}`, `rm ${PATHS.frameworkDir}`]);
    await cleanFrameworkCache({ framework: true, xcuitest: true }, PATHS, io);
    expect(io.removed).toEqual([PATHS.frameworkDir, PATHS.frameworkDir, PATHS.xcuitestDir]);
  });

});

describe('buildFrameworkCache', () => {
  it('runs the selected build scripts in order, each after its own line, and resolves 0', async () => {
    const io = fakeIo();
    await expect(buildFrameworkCache({ framework: true, xcuitest: true }, PATHS, io)).resolves.toBe(0);
    expect(io.events).toEqual([
      `log detox: building the Detox framework cache at ${PATHS.frameworkDir}`,
      `run ${PATHS.frameworkScript}`,
      `log detox: building the XCUITest runner cache at ${PATHS.xcuitestDir}`,
      `run ${PATHS.xcuitestScript}`,
    ]);
  });

  it('stops at the first failing script and resolves its exit code', async () => {
    const io = fakeIo('darwin', PATHS.frameworkScript);
    await expect(buildFrameworkCache({ framework: true, xcuitest: true }, PATHS, io)).resolves.toBe(65);
    expect(io.ran).toEqual([PATHS.frameworkScript]);
    expect(io.lines.join('\n')).toMatch(/building the Detox framework failed \(exit 65\)/);
  });

  it('lets a script that cannot start reject through, running nothing after it', async () => {
    const io = fakeIo();
    io.runScript = async () => {
      throw new UsageError('detox: could not run x: EACCES');
    };
    await expect(buildFrameworkCache({ framework: true, xcuitest: true }, PATHS, io)).rejects.toThrow(/EACCES/);
  });

});

describe('runFrameworkCacheVerb', () => {
  const DIRS = { frameworkDir: PATHS.frameworkDir, xcuitestDir: PATHS.xcuitestDir };
  const SCRIPTS = { frameworkScript: PATHS.frameworkScript, xcuitestScript: PATHS.xcuitestScript };
  const all = { framework: true, xcuitest: true };

  it('clean removes, build runs, rebuild does both — clean first', async () => {
    const clean = fakeIo();
    await expect(runFrameworkCacheVerb('clean-framework-cache', all, DIRS, () => SCRIPTS, clean)).resolves.toBe(0);
    expect(clean.removed).toHaveLength(2);
    expect(clean.ran).toHaveLength(0);

    const build = fakeIo();
    await expect(runFrameworkCacheVerb('build-framework-cache', all, DIRS, () => SCRIPTS, build)).resolves.toBe(0);
    expect(build.removed).toHaveLength(0);
    expect(build.ran).toHaveLength(2);

    const rebuild = fakeIo();
    await expect(runFrameworkCacheVerb('rebuild-framework-cache', all, DIRS, () => SCRIPTS, rebuild)).resolves.toBe(0);
    expect(rebuild.events.map((event) => event.split(' ')[0])).toEqual(['log', 'rm', 'log', 'rm', 'log', 'run', 'log', 'run']);
  });

  it('clean never looks the scripts up; build and rebuild do, before any removal', async () => {
    const missing = (): never => {
      throw new UsageError('detox: the framework build scripts were not found next to the CLI');
    };
    const clean = fakeIo();
    await expect(runFrameworkCacheVerb('clean-framework-cache', all, DIRS, missing, clean)).resolves.toBe(0);
    expect(clean.removed).toHaveLength(2);

    const build = fakeIo();
    await expect(runFrameworkCacheVerb('build-framework-cache', all, DIRS, missing, build)).rejects.toThrow(/not found/);
    expect(build.ran).toEqual([]);

    const rebuild = fakeIo();
    await expect(runFrameworkCacheVerb('rebuild-framework-cache', all, DIRS, missing, rebuild)).rejects.toThrow(/not found/);
    expect(rebuild.removed).toEqual([]);
    expect(rebuild.events).toEqual([]);
  });

  it('is the one notice and exit 0 off macOS, for every verb, before anything else', async () => {
    for (const verb of FRAMEWORK_CACHE_VERBS) {
      const io = fakeIo('linux');
      await expect(
        runFrameworkCacheVerb(verb, all, DIRS, () => {
          throw new Error('the scripts are not even looked up');
        }, io),
      ).resolves.toBe(0);
      expect(io.removed).toEqual([]);
      expect(io.ran).toEqual([]);
      expect(io.lines).toEqual(['detox: the framework cache is macOS-only — nothing to do on this platform.']);
    }
  });

  it('rebuild with one component selected leaves the other alone on both halves', async () => {
    const io = fakeIo();
    await expect(
      runFrameworkCacheVerb('rebuild-framework-cache', { framework: true, xcuitest: false }, DIRS, () => SCRIPTS, io),
    ).resolves.toBe(0);
    expect(io.removed).toEqual([PATHS.frameworkDir]);
    expect(io.ran).toEqual([PATHS.frameworkScript]);
  });

  it('rebuild propagates a failing build after the clean already happened', async () => {
    const io = fakeIo('darwin', PATHS.xcuitestScript);
    await expect(runFrameworkCacheVerb('rebuild-framework-cache', all, DIRS, () => SCRIPTS, io)).resolves.toBe(65);
    expect(io.removed).toHaveLength(2);
    expect(io.ran).toEqual([PATHS.frameworkScript, PATHS.xcuitestScript]);
  });
});
