/**
 * The reader functions (spec 009: a function, no module-level cache):
 * resolveRun = discover → select → compose over a real filesystem;
 * resolveServing needs only the `server` section and returns {} when no
 * config exists anywhere — but a bad explicit override (-C or
 * DETOX_CONFIG_PATH) stays a refusal. AbortSignal is consulted between
 * steps: an already-aborted signal rejects promptly.
 */
import { mkdtempSync, realpathSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, it, expect } from 'vitest';

import { ConfigError } from '../errors';
import { resolveRun, resolveServing } from '../resolve';

function tempDir(): string {
  return mkdtempSync(path.join(os.tmpdir(), 'detox-cli-resolve-'));
}

interface Project {
  dir: string;
  file: string;
}

function makeProject(config: unknown, filename = '.detoxrc.json'): Project {
  const dir = tempDir();
  const file = path.join(dir, filename);
  writeFileSync(file, JSON.stringify(config));
  return { dir, file };
}

const RUN_CONFIG = {
  client: { server: 'ws://localhost:8099' },
  apps: { main: { type: 'ios.app', binaryPath: 'bin/Example.app' } },
  devices: { sim: { type: 'ios.simulator', device: 'iPhone 14' } },
  configurations: { 'ios.sim': { device: 'sim', app: 'main' } },
};

describe('resolveRun', () => {
  it('discovers, selects the single configuration, and composes', async () => {
    const { dir, file } = makeProject(RUN_CONFIG);
    const run = await resolveRun({ cwd: dir, env: {}, flags: {} });
    expect(run.configPath).toBe(file);
    expect(run.configurationName).toBe('ios.sim');
    expect(run.snapshot.client.server).toBe('ws://localhost:8099');
    expect(run.snapshot.apps[0].binaryPath).toBe(path.resolve(dir, 'bin/Example.app'));
    expect(run.runnerArgs).toEqual({ $0: 'jest' });
  });

  it('respects DETOX_CONFIG_PATH; the -C flag beats the env var', async () => {
    const empty = tempDir();
    const { file } = makeProject(RUN_CONFIG);
    const viaEnv = await resolveRun({
      cwd: empty,
      env: { DETOX_CONFIG_PATH: file },
      flags: {},
    });
    // Overrides go through require.resolve, which realpaths — the macOS
    // tmpdir symlink dissolves, unlike the walk's path.join'd result.
    expect(viaEnv.configPath).toBe(realpathSync(file));

    // The env names a path that does not exist; the flag names a good one —
    // the flag wins, so this resolves instead of refusing.
    const viaFlag = await resolveRun({
      cwd: empty,
      env: { DETOX_CONFIG_PATH: path.join(empty, 'nowhere.json') },
      flags: { configPath: file },
    });
    expect(viaFlag.configPath).toBe(realpathSync(file));
  });

  it('an empty DETOX_CONFIG_PATH counts as unset', async () => {
    const { dir, file } = makeProject(RUN_CONFIG);
    const run = await resolveRun({ cwd: dir, env: { DETOX_CONFIG_PATH: '' }, flags: {} });
    expect(run.configPath).toBe(file);
  });

  it('passes the configuration flag through selection', async () => {
    const { dir } = makeProject({
      ...RUN_CONFIG,
      configurations: {
        'ios.sim': { device: 'sim', app: 'main' },
        'ios.other': { device: 'sim', app: 'main' },
      },
    });
    const run = await resolveRun({ cwd: dir, env: {}, flags: { configuration: 'ios.other' } });
    expect(run.configurationName).toBe('ios.other');
    await expect(resolveRun({ cwd: dir, env: {}, flags: {} })).rejects.toThrow(
      /several configurations and no selection/,
    );
  });

  /**
   * @issue DTX-5006
   * `resolveRun`/`resolveServing` await `Promise.resolve()` before the
   * first step so an already-aborted signal rejects the same way a later
   * one would — as a promise rejection, never a synchronous throw.
   */
  it('an already-aborted signal rejects before any work', async () => {
    const { dir } = makeProject(RUN_CONFIG);
    const controller = new AbortController();
    controller.abort(new Error('caller gave up'));
    await expect(
      resolveRun({ cwd: dir, env: {}, flags: {}, signal: controller.signal }),
    ).rejects.toThrow('caller gave up');
  });
});

describe('resolveServing', () => {
  /**
   * @issue DTX-5007
   * A serving verb runs happily with no config file anywhere on the walk —
   * only an explicit override (`-C` or `DETOX_CONFIG_PATH`) that fails to
   * resolve stays a refusal.
   */
  it('returns {} when no config file exists anywhere up the tree', async () => {
    const dir = tempDir();
    const serving = await resolveServing({ cwd: dir, env: {}, flags: {} });
    expect(serving).toEqual({});
  });

  it('still refuses when an explicit override is bad — flag or env', async () => {
    const dir = tempDir();
    await expect(
      resolveServing({ cwd: dir, env: {}, flags: { configPath: 'no-such.json' } }),
    ).rejects.toThrow(ConfigError);
    await expect(
      resolveServing({ cwd: dir, env: { DETOX_CONFIG_PATH: 'no-such.json' }, flags: {} }),
    ).rejects.toThrow(ConfigError);
  });

  it('reads the top-level server section — no configurations key required', async () => {
    const { dir, file } = makeProject({ server: { port: 8099, host: '0.0.0.0' } });
    const serving = await resolveServing({ cwd: dir, env: {}, flags: {} });
    expect(serving.configPath).toBe(file);
    expect(serving.serverSection).toEqual({ port: 8099, host: '0.0.0.0' });
  });

  it('a config with no server section yields the path and no section', async () => {
    const { dir, file } = makeProject(RUN_CONFIG);
    const serving = await resolveServing({ cwd: dir, env: {}, flags: {} });
    expect(serving.configPath).toBe(file);
    expect(serving.serverSection).toBeUndefined();
  });

  it("with a configuration flag, that configuration's server replaces the top-level wholesale", async () => {
    const { dir } = makeProject({
      server: { port: 8099, host: '0.0.0.0' },
      configurations: {
        farm: { server: { port: 9200 } },
        local: {},
      },
    });
    const serving = await resolveServing({ cwd: dir, env: {}, flags: { configuration: 'farm' } });
    expect(serving.serverSection).toEqual({ port: 9200 });
    // An unknown configuration name refuses even for a serving verb.
    await expect(
      resolveServing({ cwd: dir, env: {}, flags: { configuration: 'ghost' } }),
    ).rejects.toThrow(/no configuration named "ghost"/);
  });

  /**
   * @issue DTX-5008
   * The serving verbs honor the same selector precedence as `detox test`:
   * `-c` flag, then `DETOX_CONFIGURATION` env, one resolution story for
   * every verb. With neither selector the top-level `server` section alone
   * governs — a multi-configuration file must not force a serving verb to
   * pick one.
   */
  it('DETOX_CONFIGURATION selects for a serving verb too, and the -c flag beats it', async () => {
    const { dir } = makeProject({
      server: { port: 8099 },
      configurations: {
        farm: { server: { port: 9200 } },
        local: { server: { port: 9300 } },
      },
    });
    const viaEnv = await resolveServing({
      cwd: dir,
      env: { DETOX_CONFIGURATION: 'farm' },
      flags: {},
    });
    expect(viaEnv.serverSection).toEqual({ port: 9200 });
    const flagBeatsEnv = await resolveServing({
      cwd: dir,
      env: { DETOX_CONFIGURATION: 'farm' },
      flags: { configuration: 'local' },
    });
    expect(flagBeatsEnv.serverSection).toEqual({ port: 9300 });
    // An empty env var is unset, not a selector — the
    // top-level section governs.
    const emptyEnv = await resolveServing({
      cwd: dir,
      env: { DETOX_CONFIGURATION: '' },
      flags: {},
    });
    expect(emptyEnv.serverSection).toEqual({ port: 8099 });
    // An env var naming a ghost refuses, same as the flag would.
    await expect(
      resolveServing({ cwd: dir, env: { DETOX_CONFIGURATION: 'ghost' }, flags: {} }),
    ).rejects.toThrow(/no configuration named "ghost"/);
  });

  it('an already-aborted signal rejects', async () => {
    const { dir } = makeProject(RUN_CONFIG);
    const controller = new AbortController();
    controller.abort(new Error('stopped'));
    await expect(
      resolveServing({ cwd: dir, env: {}, flags: {}, signal: controller.signal }),
    ).rejects.toThrow('stopped');
  });
});
