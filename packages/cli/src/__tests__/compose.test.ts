/**
 * Config composition (spec 009; zod strict objects, auth opt-in, bundleId
 * optional): legacy keys refuse as signposts, the device refuses before the
 * app, the matcher maps {type→model, os, id→deviceId}, unknown keys inside
 * consumed structures
 * refuse by file + key path while top-level and app-level strangers forward
 * verbatim into the snapshot (warned once each where v20 consumed them),
 * and a configuration's `server` section replaces the top-level one
 * wholesale.
 */
import path from 'node:path';

import { describe, it, expect } from 'vitest';

import { composeRun, refuseLegacyKeys, resolveServerSection, type ComposedRun } from '../compose';
import { ConfigError } from '../errors';

const CONFIG_PATH = '/project/detox.config.js';
const CWD = path.resolve('/project');

function baseConfig(): Record<string, unknown> {
  return {
    apps: { example: { type: 'ios.app', binaryPath: 'bin/Example.app' } },
    devices: { sim: { type: 'ios.simulator', device: { type: 'iPhone 14' } } },
    configurations: { main: { device: 'sim', app: 'example' } },
  };
}

function compose(
  config: Record<string, unknown>,
  env: Record<string, string | undefined> = {},
): ComposedRun {
  return composeRun({ config, configPath: CONFIG_PATH, configurationName: 'main', cwd: CWD, env });
}

describe('refuseLegacyKeys', () => {
  it('`session` refuses with the new spelling in the message: client', () => {
    const config = { ...baseConfig(), session: { server: 'ws://localhost:8099' } };
    expect(() => refuseLegacyKeys(config, CONFIG_PATH)).toThrow(ConfigError);
    expect(() => refuseLegacyKeys(config, CONFIG_PATH)).toThrow(/session/);
    expect(() => refuseLegacyKeys(config, CONFIG_PATH)).toThrow(/client/);
    // composeRun fires the same refusal before composing anything.
    expect(() => compose(config)).toThrow(/session/);
  });

  it('a STRING testRunner is a v19 refusal naming testRunner', () => {
    const config = { ...baseConfig(), testRunner: 'jest' };
    expect(() => compose(config)).toThrow(/testRunner: a string testRunner is v19/);
  });

  it('runnerConfig and specs are v19 refusals', () => {
    expect(() => compose({ ...baseConfig(), runnerConfig: 'e2e/config.json' })).toThrow(
      /runnerConfig: a v19-era key/,
    );
    expect(() => compose({ ...baseConfig(), specs: 'e2e' })).toThrow(/specs: a v19-era key/);
  });
});

describe('composeRun — client', () => {
  it('an unknown key inside client refuses naming the section and the key', () => {
    expect(() => compose({ ...baseConfig(), client: { url: 'ws://x' } })).toThrow(ConfigError);
    // zod's unrecognized-key issue carries an empty path — the section is the
    // key path, the message names the stranger.
    expect(() => compose({ ...baseConfig(), client: { url: 'ws://x' } })).toThrow(
      /client: Unrecognized key: "url"/,
    );
  });

  it('client.server must be a ws:// or wss:// URL; token non-empty', () => {
    expect(() => compose({ ...baseConfig(), client: { server: 'http://x' } })).toThrow(
      /client\.server.*ws:\/\/ or wss:\/\//,
    );
    expect(() => compose({ ...baseConfig(), client: { token: '' } })).toThrow(/client\.token/);
  });

  it('snapshot.client carries server and token only when configured', () => {
    const bare = compose(baseConfig());
    expect(bare.snapshot.client).toEqual({});

    const full = compose({
      ...baseConfig(),
      client: { server: 'wss://farm.local:8099', token: 'file-token' },
    });
    expect(full.snapshot.client).toEqual({ server: 'wss://farm.local:8099', token: 'file-token' });
  });

  /**
   * @issue DTX-5014
   * At alpha nothing is ever spawned, so `false` (or omitting `autostart`
   * entirely) is the only truthful value — and it is the spelling the
   * post-alpha helper keeps forever as its CI opt-out. `true` belongs to
   * the helper era's vocabulary and refuses instead of a silent no-op.
   * The key decides whether a SERVER is started, so it lives in `server`.
   */
  it('server.autostart: false is the spelling, and it never reaches the snapshot', () => {
    const composed = compose({ ...baseConfig(), server: { autostart: false } });
    expect(composed.autostart).toBe(false);
    expect(composed.snapshot.client).toEqual({});
    expect(composed.warnings).toEqual([]);
  });

  it('server.autostart: true refuses', () => {
    expect(() => compose({ ...baseConfig(), server: { autostart: true } })).toThrow(ConfigError);
    expect(() => compose({ ...baseConfig(), server: { autostart: true } })).toThrow(
      /server\.autostart.*not a supported spelling/s,
    );
  });

  it('client.autostart is not a key — an alpha breaks the spelling instead of adapting it', () => {
    expect(() => compose({ ...baseConfig(), client: { autostart: false } })).toThrow(ConfigError);
    expect(() => compose({ ...baseConfig(), client: { autostart: false } })).toThrow(
      /client.*Unrecognized key.*autostart/s,
    );
  });

  it('absence is the helper path', () => {
    const composed = compose(baseConfig());
    expect(composed.autostart).toBeUndefined();
    expect(composed.warnings).toEqual([]);
  });

  /**
   * @issue DTX-5023
   * `DETOX_CLIENT_TOKEN` beats `client.token` when set — a CI secret beats
   * a committed file. An empty env string counts as unset, not a token,
   * so the file's token survives.
   */
  it('DETOX_CLIENT_TOKEN overrides client.token; an EMPTY env string does not', () => {
    const config = { ...baseConfig(), client: { token: 'file-token' } };
    expect(compose(config, { DETOX_CLIENT_TOKEN: 'ci-secret' }).snapshot.client.token).toBe(
      'ci-secret',
    );
    expect(compose(config, { DETOX_CLIENT_TOKEN: '' }).snapshot.client.token).toBe('file-token');
    // Env alone is enough — no client block needed.
    expect(compose(baseConfig(), { DETOX_CLIENT_TOKEN: 'ci-only' }).snapshot.client.token).toBe(
      'ci-only',
    );
  });
});

describe('composeRun — device', () => {
  /**
   * @issue DTX-5024
   * Device composes and refuses before the app — the refusal order spec
   * 009 pins. A bad device is named in the error; a bad app never gets the
   * chance to speak first.
   */
  it('DEVICE refuses BEFORE the app: android.emulator is named, not android.apk', () => {
    const config = {
      apps: { bad: { type: 'android.apk', binaryPath: 'app.apk' } },
      devices: { emu: { type: 'android.emulator', device: { avdName: 'Pixel' } } },
      configurations: { main: { device: 'emu', app: 'bad' } },
    };
    let message = '';
    try {
      compose(config);
    } catch (err) {
      expect(err).toBeInstanceOf(ConfigError);
      message = (err as Error).message;
    }
    expect(message).toContain('android.emulator');
    expect(message).not.toContain('android.apk');
    expect(message).toContain('configurations.main.device.type');
  });

  /**
   * Spec 015: `device.type` is a Detox 20 name or a driver
   * package the server imports. Compose refuses only the legacy names with
   * no driver in this release, by name, and passes any other type through.
   */
  it('device.type is a driver name: a package specifier composes through, a driverless legacy name is refused', () => {
    const config = baseConfig();
    config.devices = { cloud: { type: '@acme/detox-driver-foo', device: { type: 'iPhone 14 Pro' } } };
    config.configurations = { main: { device: 'cloud', app: 'example' } };
    expect(compose(config).snapshot.device).toEqual({
      type: '@acme/detox-driver-foo',
      query: { model: 'iPhone 14 Pro' },
    });

    const refused = baseConfig();
    refused.devices = { attached: { type: 'android.attached', device: { type: 'Pixel 7' } } };
    refused.configurations = { main: { device: 'attached', app: 'example' } };
    expect(() => compose(refused)).toThrow(/android\.attached/);
  });

  it('matcher keys map {type→model, os→os, id→deviceId}; a number os coerces to string', () => {
    const config = baseConfig();
    config.devices = {
      sim: {
        type: 'ios.simulator',
        device: { type: 'iPhone 14 Pro', os: 17.2, id: 'AAAA-BBBB' },
      },
    };
    expect(compose(config).snapshot.device).toEqual({
      type: 'ios.simulator',
      query: { model: 'iPhone 14 Pro', os: '17.2', deviceId: 'AAAA-BBBB' },
    });
  });

  it("string shorthand: 'iPhone 14' → model; 'iPhone 14, 16.0' → model + os", () => {
    const one = baseConfig();
    one.devices = { sim: { type: 'ios.simulator', device: 'iPhone 14' } };
    expect(compose(one).snapshot.device.query).toEqual({ model: 'iPhone 14' });

    const two = baseConfig();
    two.devices = { sim: { type: 'ios.simulator', device: 'iPhone 14, 16.0' } };
    expect(compose(two).snapshot.device.query).toEqual({ model: 'iPhone 14', os: '16.0' });
  });

  it('no matcher at all is an empty (match-anything) query', () => {
    const config = baseConfig();
    config.devices = { sim: { type: 'ios.simulator' } };
    expect(compose(config).snapshot.device.query).toEqual({});
  });

  it('matcher key `name` refuses, recommending the model string and the udid', () => {
    const config = baseConfig();
    config.devices = { sim: { type: 'ios.simulator', device: { name: 'My Sim' } } };
    expect(() => compose(config)).toThrow(/device\.name/);
    expect(() => compose(config)).toThrow(/`type` \(the model string\) or `id` \(the udid\)/);
  });

  it('any other unknown matcher key refuses naming the v21 query vocabulary', () => {
    const config = baseConfig();
    config.devices = { sim: { type: 'ios.simulator', device: { screen: 'big' } } };
    expect(() => compose(config)).toThrow(/device\.screen: not a v21 device matcher key/);
  });

  it('a non-string, non-object matcher and a missing/empty type each refuse', () => {
    const noType = baseConfig();
    noType.devices = { sim: { device: 'iPhone 14' } };
    expect(() => compose(noType)).toThrow(/device\.type: the device needs a type/);

    const badMatcher = baseConfig();
    badMatcher.devices = { sim: { type: 'ios.simulator', device: 42 } };
    expect(() => compose(badMatcher)).toThrow(/matcher object or a shorthand string/);

    const badValue = baseConfig();
    badValue.devices = { sim: { type: 'ios.simulator', device: { os: true } } };
    expect(() => compose(badValue)).toThrow(/device\.os: must be a string/);
  });

  /**
   * @issue DTX-5018
   * Device siblings that are not the query (`headless`, `bootArgs`,
   * `gpuMode`, …) forward into `snapshot.device` and warn once each by key
   * — the server owns simulator lifecycle in v21, so per-run boot options
   * have no consumer yet.
   */
  it('device siblings (headless, …) warn by key AND ride into snapshot.device', () => {
    const config = baseConfig();
    config.devices = {
      sim: { type: 'ios.simulator', device: 'iPhone 14', headless: true, bootArgs: '-quiet' },
    };
    const { snapshot, warnings } = compose(config);
    expect(snapshot.device.headless).toBe(true);
    expect(snapshot.device.bootArgs).toBe('-quiet');
    expect(warnings.some((w) => w.includes('device.headless'))).toBe(true);
    expect(warnings.some((w) => w.includes('device.bootArgs'))).toBe(true);
  });

  it('a configuration with no device refuses before anything app-shaped', () => {
    const config = baseConfig();
    config.configurations = { main: { app: 'example' } };
    expect(() => compose(config)).toThrow(/resolves no device/);
  });

  it('an unknown device alias refuses listing the available devices', () => {
    const config = baseConfig();
    config.configurations = { main: { device: 'ghost', app: 'example' } };
    expect(() => compose(config)).toThrow(/no "ghost" in the top-level devices dictionary/);
    expect(() => compose(config)).toThrow(/Available: sim/);
  });
});

describe('composeRun — apps', () => {
  it('an unknown app alias refuses listing available aliases', () => {
    const config = baseConfig();
    config.configurations = { main: { device: 'sim', app: 'ghost' } };
    expect(() => compose(config)).toThrow(/no "ghost" in the top-level apps dictionary/);
    expect(() => compose(config)).toThrow(/Available: example/);
  });

  it('`app` and `apps` together refuse; neither refuses too', () => {
    const both = baseConfig();
    both.configurations = { main: { device: 'sim', app: 'example', apps: ['example'] } };
    expect(() => compose(both)).toThrow(/use `app` or `apps`, not both/);

    const neither = baseConfig();
    neither.configurations = { main: { device: 'sim' } };
    expect(() => compose(neither)).toThrow(/resolves no app/);
  });

  it('two apps resolving the same name refuse (default name counts)', () => {
    const config = baseConfig();
    config.configurations = {
      main: {
        device: 'sim',
        apps: [
          { type: 'ios.app', binaryPath: 'a/A.app' },
          { type: 'ios.app', binaryPath: 'b/B.app' },
        ],
      },
    };
    expect(() => compose(config)).toThrow(/two apps named "default"/);
  });

  it("name defaults to 'default'; explicit names pass through", () => {
    const config = baseConfig();
    config.configurations = {
      main: {
        device: 'sim',
        apps: [
          { type: 'ios.app', binaryPath: 'a/A.app' },
          { name: 'companion', type: 'ios.app', bundleId: 'com.x.companion' },
        ],
      },
    };
    const { snapshot } = compose(config);
    expect(snapshot.apps.map((app) => app.name)).toEqual(['default', 'companion']);
  });

  it('app type must be ios.app — checked after the device passed', () => {
    const config = baseConfig();
    config.apps = { example: { type: 'android.apk', binaryPath: 'x.apk' } };
    expect(() => compose(config)).toThrow(/app\.type.*"android\.apk" is not runnable/);
  });

  /**
   * @issue DTX-5021
   * `binaryPath` resolves absolute against the CLI's cwd — v20's base for a
   * relative path.
   */
  it('binaryPath resolves ABSOLUTE against cwd; bundleId stays optional', () => {
    const { snapshot } = compose(baseConfig());
    expect(snapshot.apps[0].binaryPath).toBe(path.resolve(CWD, 'bin/Example.app'));
    expect(snapshot.apps[0].bundleId).toBeUndefined();

    // bundleId alone is enough (no binary: a preinstalled app).
    const byId = baseConfig();
    byId.apps = { example: { type: 'ios.app', bundleId: 'com.example.app' } };
    expect(compose(byId).snapshot.apps[0]).toEqual({
      name: 'default',
      type: 'ios.app',
      bundleId: 'com.example.app',
    });
  });

  /**
   * @issue DTX-5019
   * `bundleId` is optional — derived client-side from
   * `binaryPath`'s `Info.plist` at `connect`, never here. With neither
   * `bundleId` nor `binaryPath` present, `composeApps` refuses naming both.
   */
  it('NEITHER bundleId NOR binaryPath → refusal naming both', () => {
    const config = baseConfig();
    config.apps = { example: { type: 'ios.app' } };
    let message = '';
    try {
      compose(config);
    } catch (err) {
      expect(err).toBeInstanceOf(ConfigError);
      message = (err as Error).message;
    }
    expect(message).toContain('bundleId');
    expect(message).toContain('binaryPath');
  });

  /**
   * @issue DTX-5020
   * Everything besides `name`/`binaryPath` — `type`, `bundleId`, `build`,
   * `launchArgs`, real v20 vocabulary like `permissions` — forwards into
   * the snapshot app verbatim; compat and heir specs consume it from there.
   */
  it('app extras forward into the snapshot app verbatim', () => {
    const config = baseConfig();
    config.apps = {
      example: {
        type: 'ios.app',
        binaryPath: 'bin/Example.app',
        bundleId: 'com.example.app',
        build: 'xcodebuild -scheme Example',
        launchArgs: { detoxDebug: true },
        permissions: { notifications: 'YES' },
      },
    };
    const app = compose(config).snapshot.apps[0];
    expect(app.type).toBe('ios.app');
    expect(app.bundleId).toBe('com.example.app');
    expect(app.build).toBe('xcodebuild -scheme Example');
    expect(app.launchArgs).toEqual({ detoxDebug: true });
    expect(app.permissions).toEqual({ notifications: 'YES' });
  });

  it('app key `start` warns and still forwards', () => {
    const config = baseConfig();
    config.apps = {
      example: { type: 'ios.app', binaryPath: 'bin/Example.app', start: 'npm run start' },
    };
    const { snapshot, warnings } = compose(config);
    expect(snapshot.apps[0].start).toBe('npm run start');
    expect(warnings.filter((w) => w.includes('.start:'))).toHaveLength(1);
  });

  it('bad bundleId / binaryPath values refuse by key path', () => {
    const emptyBundle = baseConfig();
    emptyBundle.apps = { example: { type: 'ios.app', bundleId: '' } };
    expect(() => compose(emptyBundle)).toThrow(/bundleId: must be a non-empty string/);

    const badBinary = baseConfig();
    badBinary.apps = { example: { type: 'ios.app', binaryPath: 42 } };
    expect(() => compose(badBinary)).toThrow(/binaryPath: must be a non-empty string/);
  });
});

describe('composeRun — testRunner and runnerArgs', () => {
  it("args defaults to {$0: 'jest'} when testRunner is absent", () => {
    expect(compose(baseConfig()).runnerArgs).toEqual({ $0: 'jest' });
  });

  it('runnerArgs = {$0 default, ...args}; a configured $0 wins', () => {
    const config = {
      ...baseConfig(),
      testRunner: { args: { config: 'e2e/jest.config.js', maxWorkers: 2 } },
    };
    expect(compose(config).runnerArgs).toEqual({
      $0: 'jest',
      config: 'e2e/jest.config.js',
      maxWorkers: 2,
    });
    const custom = { ...baseConfig(), testRunner: { args: { $0: 'nyc jest' } } };
    expect(compose(custom).runnerArgs.$0).toBe('nyc jest');
  });

  it('$0 must be a non-empty command string', () => {
    expect(() =>
      compose({ ...baseConfig(), testRunner: { args: { $0: '   ' } } }),
    ).toThrow(/testRunner\.args\.\$0: must be a non-empty command string/);
    expect(() => compose({ ...baseConfig(), testRunner: { args: { $0: 42 } } })).toThrow(
      ConfigError,
    );
  });

  it('non-object testRunner.args (and non-string non-object testRunner) refuse', () => {
    expect(() => compose({ ...baseConfig(), testRunner: { args: 'jest' } })).toThrow(
      /testRunner\.args: must be an object/,
    );
    expect(() => compose({ ...baseConfig(), testRunner: 42 })).toThrow(
      /testRunner: must be an object/,
    );
  });

  it('retries/bail/detached/forwardEnv/inspectBrk each warn ONCE by name', () => {
    const config = {
      ...baseConfig(),
      testRunner: { args: {}, retries: 2, bail: true, detached: true, forwardEnv: true, inspectBrk: true },
    };
    const { warnings } = compose(config);
    for (const key of ['retries', 'bail', 'detached', 'forwardEnv', 'inspectBrk']) {
      expect(warnings.filter((w) => w.includes(`testRunner.${key}`))).toHaveLength(1);
    }
  });

  it('the testRunner object rides into the snapshot verbatim (`jest` block unwarned)', () => {
    const testRunner = { args: { $0: 'jest' }, jest: { setupTimeout: 120000 }, retries: 1 };
    const { snapshot, warnings } = compose({ ...baseConfig(), testRunner });
    expect(snapshot.testRunner).toEqual(testRunner);
    expect(warnings.some((w) => w.includes('testRunner.jest'))).toBe(false);
    // Absent testRunner leaves the snapshot without the key.
    expect('testRunner' in compose(baseConfig()).snapshot).toBe(false);
  });
});

describe('composeRun — forwarding and warnings at the top level', () => {
  it('unknown top-level keys forward into the snapshot JSON-identical', () => {
    const config = {
      ...baseConfig(),
      artifacts: { rootDir: 'artifacts', plugins: { log: 'all' } },
      behavior: { init: { exposeGlobals: false } },
      anythingElse: [1, { deep: true }],
    };
    const { snapshot, warnings } = compose(config);
    expect(snapshot.artifacts).toEqual({ rootDir: 'artifacts', plugins: { log: 'all' } });
    expect(snapshot.behavior).toEqual({ init: { exposeGlobals: false } });
    expect(snapshot.anythingElse).toEqual([1, { deep: true }]);
    // Forwarded, not warned — these belong to heirs, not to v20's consumed set.
    expect(warnings.some((w) => w.startsWith('artifacts'))).toBe(false);
  });

  it('logger warns once and forwards', () => {
    const { snapshot, warnings } = compose({ ...baseConfig(), logger: { level: 'trace' } });
    expect(snapshot.logger).toEqual({ level: 'trace' });
    expect(warnings.filter((w) => w.startsWith('logger:'))).toHaveLength(1);
  });

  it('consumed top-level keys do NOT leak into the snapshot', () => {
    const config = { ...baseConfig(), client: { server: 'ws://localhost:8099' } };
    const { snapshot } = compose(config);
    expect('configurations' in snapshot).toBe(false);
    expect('devices' in snapshot).toBe(false);
    expect('apps' in snapshot).toBe(true); // the RESOLVED array, not the dictionary
    expect(Array.isArray(snapshot.apps)).toBe(true);
    expect(snapshot.configurationName).toBe('main');
  });

  it('an unknown key inside a configuration entry refuses by section and key (strict)', () => {
    const config = baseConfig();
    config.configurations = { main: { device: 'sim', app: 'example', behaviour: {} } };
    expect(() => compose(config)).toThrow(/configurations\.main: Unrecognized key: "behaviour"/);
  });
});

describe('resolveServerSection', () => {
  const TOP = { host: '0.0.0.0', port: 8099 };

  it('parses the top-level section; absent → undefined', () => {
    expect(resolveServerSection({ server: TOP }, CONFIG_PATH)).toEqual(TOP);
    expect(resolveServerSection({}, CONFIG_PATH)).toBeUndefined();
  });

  /**
   * @issue DTX-5022
   * `resolveServerSection` never deep-merges: a configuration's own
   * `server` section replaces the top-level one wholesale. Two
   * half-merged servers is the silent-shadowing trap this avoids.
   */
  it("a configuration's own `server` REPLACES the top-level one wholesale — no merge", () => {
    const config = {
      server: TOP,
      configurations: { farm: { server: { port: 9200 } } },
    };
    const section = resolveServerSection(config, CONFIG_PATH, 'farm');
    expect(section).toEqual({ port: 9200 });
    expect(section?.host).toBeUndefined();
  });

  it('unknown keys inside either section refuse naming file and key path', () => {
    expect(() => resolveServerSection({ server: { prot: 1 } }, CONFIG_PATH)).toThrow(
      /server: Unrecognized key: "prot"/,
    );
    const config = { configurations: { farm: { server: { hosst: 'x' } } } };
    expect(() => resolveServerSection(config, CONFIG_PATH, 'farm')).toThrow(
      /configurations\.farm\.server: Unrecognized key: "hosst"/,
    );
    expect(() => resolveServerSection({ server: { prot: 1 } }, CONFIG_PATH)).toThrow(CONFIG_PATH);
  });

  it('nodes entries: name + ws:// url required, token non-empty when present', () => {
    const good = {
      server: { nodes: [{ name: 'mac-a', url: 'ws://mac-a.local:8099' }] },
    };
    expect(resolveServerSection(good, CONFIG_PATH)?.nodes).toHaveLength(1);

    expect(() =>
      resolveServerSection(
        { server: { nodes: [{ name: 'mac-a', url: 'http://mac-a.local' }] } },
        CONFIG_PATH,
      ),
    ).toThrow(/server\.nodes\.0\.url.*ws:\/\/ or wss:\/\//);
    expect(() =>
      resolveServerSection(
        { server: { nodes: [{ name: 'mac-a', url: 'ws://x', token: '' }] } },
        CONFIG_PATH,
      ),
    ).toThrow(/server\.nodes\.0\.token/);
    expect(() =>
      resolveServerSection({ server: { nodes: [{ url: 'ws://x' }] } }, CONFIG_PATH),
    ).toThrow(/server\.nodes\.0\.name/);
  });

  it("auth requires type 'static-token' and a non-empty token", () => {
    const good = { server: { auth: { type: 'static-token', token: 't' } } };
    expect(resolveServerSection(good, CONFIG_PATH)?.auth?.token).toBe('t');
    expect(() =>
      resolveServerSection({ server: { auth: { type: 'basic', token: 't' } } }, CONFIG_PATH),
    ).toThrow(/server\.auth\.type/);
    expect(() =>
      resolveServerSection({ server: { auth: { type: 'static-token', token: '' } } }, CONFIG_PATH),
    ).toThrow(/server\.auth\.token/);
  });

  it('composeRun returns the effective section alongside the snapshot', () => {
    const config = { ...baseConfig(), server: { port: 8099 } };
    expect(compose(config).serverSection).toEqual({ port: 8099 });
    expect(compose(baseConfig()).serverSection).toBeUndefined();
  });
});

describe('config composition contracts', () => {
  /**
   * @issue DTX-5015
   * The `session` refusal fires wherever the key appears, not just at the
   * top level: real v20 configs put `session` inside configuration entries
   * too, and a migrant deserves the same teaching refusal there rather
   * than a bare unrecognized-key message.
   */
  it('a session block INSIDE a configuration gets the same client signpost — real v20 configs carry it there', () => {
    const config = baseConfig();
    (config.configurations as Record<string, Record<string, unknown>>).main.session = {
      debugSynchronization: 3000,
    };
    expect(() => compose(config)).toThrow(/configurations\.main\.session/);
    expect(() => compose(config)).toThrow(/client/);
  });

  /**
   * @issue DTX-5016
   * `artifacts`/`behavior` scoped inside a configuration entry (real v20
   * shape) forward into the snapshot the same as their top-level forms,
   * the configuration's value winning when both are present.
   */
  it('configuration-scoped artifacts/behavior forward, the configuration value winning', () => {
    const config: Record<string, unknown> = {
      ...baseConfig(),
      artifacts: { plugins: { log: 'none' } },
    };
    (config.configurations as Record<string, Record<string, unknown>>).main.artifacts = {
      plugins: { log: 'all' },
    };
    (config.configurations as Record<string, Record<string, unknown>>).main.behavior = {
      init: { exposeGlobals: false },
    };
    const { snapshot } = compose(config);
    expect(snapshot.artifacts).toEqual({ plugins: { log: 'all' } });
    expect(snapshot.behavior).toEqual({ init: { exposeGlobals: false } });
  });

  /**
   * @issue DTX-5025
   * A forwarded top-level key that would overwrite a composed snapshot
   * field is a refusal, not a silent clobber: a top-level `device`
   * replacing the validated `{type, query}` would hand the runner an
   * empty query — the one silence the config contract forbids.
   */
  it('a forwarded top-level key may not clobber a composed snapshot field — device/app/configurationName refuse', () => {
    expect(() => compose({ ...baseConfig(), device: { type: 'ios.simulator' } })).toThrow(
      /top-level `device`/,
    );
    expect(() => compose({ ...baseConfig(), configurationName: 'main' })).toThrow(
      /selectedConfiguration/,
    );
  });

  /**
   * @issue DTX-5017
   * `queryFromShorthand` refuses a third comma-separated segment rather
   * than dropping it — silently widening the match is the one silence
   * the config contract forbids, in shorthand spelling too.
   */
  it('a shorthand with more than two comma-separated parts refuses instead of silently dropping the tail', () => {
    const config = baseConfig();
    (config.devices as Record<string, Record<string, unknown>>).sim.device =
      'iPhone 14, 16.0, extra';
    expect(() => compose(config)).toThrow(/comma-separated/);
  });
});
