/**
 * Config discovery and loading (spec 009; the reader lives in the CLI
 * package): the upward walk with v20's eight filenames where the
 * nearest directory beats filename precedence, package.json counting only
 * with a `detox` key, `-C` override resolution (require first, plain path
 * second), deep merge (objects recurse, arrays/primitives taken whole), and
 * `extends` folding with the v21-added cycle refusal.
 */
import { mkdirSync, mkdtempSync, realpathSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, it, expect } from 'vitest';

import {
  CONFIG_FILENAMES,
  applyExtends,
  deepMerge,
  discoverConfig,
  findConfigFile,
  loadConfigFile,
  resolveConfigOverride,
} from '../discover';
import { ConfigError } from '../errors';

function tempDir(): string {
  return mkdtempSync(path.join(os.tmpdir(), 'detox-cli-discover-'));
}

function write(dir: string, name: string, content: unknown): string {
  const file = path.join(dir, name);
  writeFileSync(file, typeof content === 'string' ? content : JSON.stringify(content));
  return file;
}

describe('CONFIG_FILENAMES', () => {
  it('pins the eight v20 names in v20 order, package.json last', () => {
    expect(CONFIG_FILENAMES).toEqual([
      '.detoxrc.cjs',
      '.detoxrc.js',
      '.detoxrc.json',
      '.detoxrc',
      'detox.config.cjs',
      'detox.config.js',
      'detox.config.json',
      'package.json',
    ]);
  });
});

describe('findConfigFile', () => {
  it('picks the earliest filename when a directory offers several', () => {
    const dir = tempDir();
    write(dir, 'detox.config.json', {});
    write(dir, '.detoxrc.json', {});
    expect(findConfigFile(dir)).toBe(path.join(dir, '.detoxrc.json'));
  });

  it('the nearest directory beats filename precedence on the walk up', () => {
    const parent = tempDir();
    write(parent, '.detoxrc.cjs', 'module.exports = {};');
    const child = path.join(parent, 'packages', 'app');
    mkdirSync(child, { recursive: true });
    write(child, 'detox.config.json', {});
    expect(findConfigFile(child)).toBe(path.join(child, 'detox.config.json'));
  });

  it('walks up past a directory that has nothing', () => {
    const parent = tempDir();
    write(parent, '.detoxrc.json', {});
    const child = path.join(parent, 'e2e');
    mkdirSync(child);
    expect(findConfigFile(child)).toBe(path.join(parent, '.detoxrc.json'));
  });

  /**
   * @issue DTX-5002
   * A `package.json` counts as a config only when it carries a "detox" key
   * — one without it does not stop the upward walk, v20 (cosmiconfig)
   * semantics kept.
   */
  it('package.json counts only when it has a "detox" key — else the walk continues', () => {
    const parent = tempDir();
    write(parent, 'package.json', { name: 'workspace', detox: { configurations: {} } });
    const child = path.join(parent, 'packages', 'app');
    mkdirSync(child, { recursive: true });
    write(child, 'package.json', { name: 'app' });
    expect(findConfigFile(child)).toBe(path.join(parent, 'package.json'));
  });

  /**
   * @issue DTX-5003
   * An unparseable `package.json` is not a detox config refusal — the walk
   * continues past it; npm will complain about the syntax error soon enough.
   */
  it('skips an unparseable package.json rather than refusing', () => {
    const parent = tempDir();
    write(parent, '.detoxrc.json', {});
    const child = path.join(parent, 'app');
    mkdirSync(child);
    write(child, 'package.json', '{ trailing garbage');
    expect(findConfigFile(child)).toBe(path.join(parent, '.detoxrc.json'));
  });

  it('a package.json with a detox key still loses to any dotfile beside it', () => {
    const dir = tempDir();
    write(dir, 'package.json', { detox: { fromPkg: true } });
    write(dir, '.detoxrc', {});
    expect(findConfigFile(dir)).toBe(path.join(dir, '.detoxrc'));
  });
});

describe('loadConfigFile', () => {
  it('requires .js and .cjs files (config as code)', () => {
    const dir = tempDir();
    const js = write(dir, '.detoxrc.js', 'module.exports = { fromJs: 1 };');
    const cjs = write(dir, 'detox.config.cjs', 'module.exports = { fromCjs: 2 };');
    expect(loadConfigFile(js)).toEqual({ fromJs: 1 });
    expect(loadConfigFile(cjs)).toEqual({ fromCjs: 2 });
  });

  it('parses .json and the extensionless .detoxrc as JSON', () => {
    const dir = tempDir();
    const json = write(dir, 'detox.config.json', { fromJson: true });
    const rc = write(dir, '.detoxrc', { fromRc: true });
    expect(loadConfigFile(json)).toEqual({ fromJson: true });
    expect(loadConfigFile(rc)).toEqual({ fromRc: true });
  });

  it('package.json contributes its detox key, and refuses without one', () => {
    const dir = tempDir();
    const withKey = write(dir, 'package.json', { name: 'x', detox: { apps: {} } });
    expect(loadConfigFile(withKey)).toEqual({ apps: {} });

    const bare = tempDir();
    const without = write(bare, 'package.json', { name: 'y' });
    expect(() => loadConfigFile(without)).toThrow(ConfigError);
    expect(() => loadConfigFile(without)).toThrow(/detox.*no "detox" key/);
  });

  it('a non-object config is a refusal naming the file', () => {
    const dir = tempDir();
    const arr = write(dir, 'detox.config.json', [1, 2]);
    expect(() => loadConfigFile(arr)).toThrow(/must be an object/);
    expect(() => loadConfigFile(arr)).toThrow(arr);
  });

  it('unreadable file and invalid JSON each refuse with the cause', () => {
    expect(() => loadConfigFile(path.join(tempDir(), '.detoxrc'))).toThrow(
      /could not read the config file/,
    );
    const bad = write(tempDir(), '.detoxrc.json', '{ nope');
    expect(() => loadConfigFile(bad)).toThrow(/not valid JSON/);
  });
});

/**
 * @issue DTX-5004
 * `resolveConfigOverride` tries node `require` resolution first, then falls
 * back to a plain existing path, refusing only when neither resolves. v20's
 * "legacy filesystem resolution" warning dance is not replicated.
 */
describe('resolveConfigOverride', () => {
  it('require-resolution first: a relative specifier resolves from cwd', () => {
    const cwd = tempDir();
    const nested = path.join(cwd, 'e2e');
    mkdirSync(nested);
    const file = write(nested, 'cfg.json', {});
    // require.resolve realpaths — on macOS the tmpdir symlink dissolves.
    expect(resolveConfigOverride('./e2e/cfg.json', cwd)).toBe(realpathSync(file));
  });

  it('falls back to a plain existing path when require cannot resolve', () => {
    const cwd = tempDir();
    // A bare specifier is a package name to `require` — it fails there and
    // succeeds as a plain path relative to cwd.
    const file = write(cwd, 'my.detoxrc', {});
    expect(resolveConfigOverride('my.detoxrc', cwd)).toBe(file);
  });

  it('neither route → ConfigError naming the override', () => {
    const cwd = tempDir();
    expect(() => resolveConfigOverride('no-such-config-anywhere.json', cwd)).toThrow(ConfigError);
    expect(() => resolveConfigOverride('no-such-config-anywhere.json', cwd)).toThrow(
      /no-such-config-anywhere\.json.*neither require-resolvable nor an existing path/,
    );
  });
});

/**
 * @issue DTX-5005
 * `deepMerge` replicates v20 `tryExtendConfig`'s lodash-`merge` semantics in
 * full: plain objects merge recursively; arrays merge element-wise by index
 * (the base's tail survives a shorter override, and object elements
 * deep-merge too); `undefined` on the overriding side leaves the base value
 * in place. A migrating config with `extends` and arrays must compose
 * exactly as it did under v20.
 */
describe('deepMerge', () => {
  it('merges plain objects recursively; self wins on leaves', () => {
    const base = { a: { x: 1, y: 1 }, keep: 'base' };
    const self = { a: { y: 2, z: 3 }, extra: true };
    expect(deepMerge(base, self)).toEqual({
      a: { x: 1, y: 2, z: 3 },
      keep: 'base',
      extra: true,
    });
  });

  it('arrays merge ELEMENT-WISE by index — v20 lodash-merge semantics, kept on purpose', () => {
    expect(deepMerge({ list: [1, 2, 3], n: 1 }, { list: [9], n: 2 })).toEqual({
      list: [9, 2, 3],
      n: 2,
    });
    // Object elements deep-merge too, index by index.
    expect(
      deepMerge({ apps: [{ name: 'a', build: 'x' }] }, { apps: [{ build: 'y' }] }),
    ).toEqual({ apps: [{ name: 'a', build: 'y' }] });
    // An object under self replaces a primitive under base, whole.
    expect(deepMerge({ v: 'string' }, { v: { now: 'object' } })).toEqual({ v: { now: 'object' } });
  });

  it('an undefined on the overriding side leaves the base value in place (lodash semantics)', () => {
    expect(deepMerge({ keep: 'base' }, { keep: undefined })).toEqual({ keep: 'base' });
  });
});

describe('applyExtends', () => {
  it('folds a chain in recursively — base under self over, `extends` stripped', () => {
    const dir = tempDir();
    write(dir, 'grandparent.json', { root: true, shared: { from: 'grandparent', gp: 1 } });
    write(dir, 'parent.json', { extends: './grandparent.json', shared: { from: 'parent' } });
    const self = write(dir, 'detox.config.json', {
      extends: './parent.json',
      own: 'yes',
    });
    expect(applyExtends(loadConfigFile(self), self)).toEqual({
      root: true,
      shared: { from: 'parent', gp: 1 },
      own: 'yes',
    });
  });

  it('resolves an extends target as a plain sibling path when require cannot', () => {
    const dir = tempDir();
    // Extensionless: not require-resolvable as written, exists on disk.
    write(dir, 'base.detoxrc', { fromBase: 1 });
    const self = write(dir, '.detoxrc.json', { extends: 'base.detoxrc', own: 2 });
    expect(applyExtends(loadConfigFile(self), self)).toEqual({ fromBase: 1, own: 2 });
  });

  it('a cycle is a refusal naming the revisited file', () => {
    const dir = tempDir();
    const a = write(dir, 'a.json', { extends: './b.json' });
    write(dir, 'b.json', { extends: './a.json' });
    expect(() => applyExtends(loadConfigFile(a), a)).toThrow(ConfigError);
    // The revisited file is named — but which one depends on realpathing:
    // require.resolve dissolves a tmpdir symlink (macOS's /tmp -> /private/tmp)
    // when present, so the caller-given entry path never matches and the loop
    // is caught one hop later, at b.json; with no symlink to dissolve (Linux),
    // it's caught immediately, naming a.json. Either is a correct cycle refusal.
    expect(() => applyExtends(loadConfigFile(a), a)).toThrow(
      /cycle — .*[ab]\.json is already in this chain/,
    );
  });

  it('a self-extending file is the shortest cycle', () => {
    const dir = tempDir();
    const a = write(dir, 'a.json', { extends: './a.json' });
    expect(() => applyExtends(loadConfigFile(a), a)).toThrow(/cycle/);
  });

  it('an unresolvable extends is a refusal naming the specifier', () => {
    const dir = tempDir();
    const self = write(dir, '.detoxrc.json', { extends: 'no-such-preset-module' });
    expect(() => applyExtends(loadConfigFile(self), self)).toThrow(
      /extends.*cannot resolve "no-such-preset-module"/,
    );
  });

  it('a non-string or empty extends is a refusal', () => {
    expect(() => applyExtends({ extends: 42 }, '/x/detox.config.js')).toThrow(
      /extends.*non-empty string/,
    );
    expect(() => applyExtends({ extends: '' }, '/x/detox.config.js')).toThrow(
      /extends.*non-empty string/,
    );
  });
});

describe('discoverConfig', () => {
  it('glues walk + load + extends together', () => {
    const dir = tempDir();
    write(dir, 'base.json', { devices: { sim: { type: 'ios.simulator' } } });
    const file = write(dir, '.detoxrc.json', { extends: './base.json', apps: {} });
    const { configPath, config } = discoverConfig({ cwd: dir });
    expect(configPath).toBe(file);
    expect(config).toEqual({ devices: { sim: { type: 'ios.simulator' } }, apps: {} });
  });

  it('an override skips the walk entirely', () => {
    const home = tempDir();
    const elsewhere = tempDir();
    const file = write(elsewhere, 'cfg.json', { fromOverride: true });
    const { configPath, config } = discoverConfig({ cwd: home, override: file });
    expect(configPath).toBe(realpathSync(file));
    expect(config).toEqual({ fromOverride: true });
  });

  it('no config anywhere → refusal listing all eight filenames and the escape hatches', () => {
    const dir = tempDir();
    let message = '';
    try {
      discoverConfig({ cwd: dir });
    } catch (err) {
      expect(err).toBeInstanceOf(ConfigError);
      message = (err as Error).message;
    }
    for (const name of CONFIG_FILENAMES) {
      expect(message).toContain(name);
    }
    expect(message).toContain('DETOX_CONFIG_PATH');
    expect(message).toContain('-C');
  });
});
