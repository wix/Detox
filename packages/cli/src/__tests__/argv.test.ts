/**
 * The CLI's argv conduct (spec 009): `detox test` consumes
 * exactly -c/--configuration and -C/--config-path and forwards everything
 * else verbatim in order; the serving verbs refuse strangers by name; the
 * spawn contract renders $0 + args + _ + forwarded; the runner env gets the
 * snapshot path, the resolved DETOX_CONFIGURATION, and node_modules/.bin on
 * PATH; a config's server section becomes flags appended after the user's
 * own (first occurrence wins in the delegated mains, so the user's beat it).
 */
import path from 'node:path';

import { describe, it, expect } from 'vitest';

import {
  buildRunnerEnv,
  buildRunnerInvocation,
  collectBuildCommands,
  refuseUnknownFlags,
  serverSectionToArgs,
  splitCliArgv,
} from '../argv';
import { UsageError } from '../errors';

describe('splitCliArgv', () => {
  it('consumes -c/--configuration and -C/--config-path anywhere in the argv', () => {
    const split = splitCliArgv(['e2e/login.test.ts', '-c', 'ios.sim', '--bail', '-C', 'alt.json']);
    expect(split.configuration).toBe('ios.sim');
    expect(split.configPath).toBe('alt.json');
    expect(split.forwarded).toEqual(['e2e/login.test.ts', '--bail']);
  });

  it('long forms work; the last occurrence wins', () => {
    const split = splitCliArgv(['--configuration', 'a', '--configuration', 'b', '--config-path', 'p.json']);
    expect(split.configuration).toBe('b');
    expect(split.configPath).toBe('p.json');
  });

  it('forwards EVERYTHING else verbatim, in the user order — dashes included', () => {
    const tokens = ['--maxWorkers', '2', '-t', 'login', '--', 'positional'];
    expect(splitCliArgv(tokens).forwarded).toEqual(tokens);
  });

  it('a missing value or a value starting with "-" is a UsageError', () => {
    expect(() => splitCliArgv(['-c'])).toThrow(UsageError);
    expect(() => splitCliArgv(['-c'])).toThrow('Missing value for -c');
    expect(() => splitCliArgv(['--config-path', '--bail'])).toThrow(
      'Missing value for --config-path',
    );
  });
});

describe('refuseUnknownFlags', () => {
  const KNOWN = new Set(['--port', '-p']);

  it('an unknown flag names the token AND the verb', () => {
    expect(() => refuseUnknownFlags('server', ['--prot', '80'], KNOWN)).toThrow(UsageError);
    expect(() => refuseUnknownFlags('server', ['--prot', '80'], KNOWN)).toThrow(
      'Unknown flag for `detox server`: --prot (run `detox server --help`)',
    );
  });

  it('known flags and non-flag tokens pass', () => {
    expect(() => refuseUnknownFlags('server', ['--port', '8099', 'value', '-p', '1'], KNOWN)).not.toThrow();
    expect(() => refuseUnknownFlags('build', [], new Set())).not.toThrow();
  });
});

describe('buildRunnerInvocation', () => {
  /**
   * @issue DTX-5009
   * `buildRunnerInvocation` ports v20's `TestRunnerCommand.js` contract for
   * multi-word `$0`: split on whitespace, the first token is the spawned
   * command, and the rest lead the argv.
   */
  it("multi-word $0 'nyc jest': command is 'nyc', 'jest' leads the argv", () => {
    const { command, argv } = buildRunnerInvocation({ $0: 'nyc jest' }, []);
    expect(command).toBe('nyc');
    expect(argv).toEqual(['jest']);
  });

  it('object args render as --key value pairs in object order', () => {
    const { command, argv } = buildRunnerInvocation(
      { $0: 'jest', config: 'e2e/jest.config.js', maxWorkers: 2 },
      [],
    );
    expect(command).toBe('jest');
    expect(argv).toEqual(['--config', 'e2e/jest.config.js', '--maxWorkers', '2']);
  });

  /**
   * @issue DTX-5010
   * `renderTokenValue` renders every scalar as its string form; a
   * non-scalar (array, object) has no sane single-token rendering, so it
   * renders as one lossless, inspectable JSON token instead.
   */
  it('a non-scalar arg value renders as one lossless JSON token', () => {
    const { argv } = buildRunnerInvocation(
      { $0: 'jest', reporters: ['default', 'summary'], shard: { index: 1, total: 2 } },
      [],
    );
    expect(argv).toEqual([
      '--reporters', '["default","summary"]',
      '--shard', '{"index":1,"total":2}',
    ]);
  });

  it('boolean true is a bare flag; false and undefined are omitted', () => {
    const { argv } = buildRunnerInvocation(
      { $0: 'jest', bail: true, ci: false, silent: undefined },
      [],
    );
    expect(argv).toEqual(['--bail']);
  });

  it('_ positionals follow the configured flags; forwarded tokens come last, verbatim', () => {
    const { argv } = buildRunnerInvocation(
      { $0: 'jest', bail: true, _: ['e2e/smoke'] },
      ['--maxWorkers', '1', 'e2e/login.test.ts'],
    );
    expect(argv).toEqual(['--bail', 'e2e/smoke', '--maxWorkers', '1', 'e2e/login.test.ts']);
  });
});

/**
 * @issue DTX-5011
 * `buildRunnerEnv` writes `DETOX_CONFIG_SNAPSHOT_PATH` and the *resolved*
 * `DETOX_CONFIGURATION` (real v20 projects branch their jest.config.js on
 * the configuration name), and prepends
 * `<cwd>/node_modules/.bin` to `PATH` so a devDependency jest resolves
 * (ported from v20 `prependNodeModulesBinToPATH`).
 */
describe('buildRunnerEnv', () => {
  const INPUT = {
    snapshotPath: '/tmp/snap/config-snapshot.json',
    configurationName: 'ios.sim',
    cwd: '/project',
  };
  const BIN = path.join('/project', 'node_modules', '.bin');

  it('sets the snapshot path and the RESOLVED configuration name', () => {
    const env = buildRunnerEnv({ base: { HOME: '/home/u', PATH: '/usr/bin' }, ...INPUT });
    expect(env.DETOX_CONFIG_SNAPSHOT_PATH).toBe('/tmp/snap/config-snapshot.json');
    expect(env.DETOX_CONFIGURATION).toBe('ios.sim');
    expect(env.HOME).toBe('/home/u');
  });

  it('prepends <cwd>/node_modules/.bin to PATH with the platform delimiter', () => {
    const env = buildRunnerEnv({ base: { PATH: '/usr/bin' }, ...INPUT });
    expect(env.PATH).toBe(`${BIN}${path.delimiter}/usr/bin`);
  });

  it('an empty or undefined base PATH becomes just the bin dir — no dangling delimiter', () => {
    expect(buildRunnerEnv({ base: { PATH: '' }, ...INPUT }).PATH).toBe(BIN);
    expect(buildRunnerEnv({ base: {}, ...INPUT }).PATH).toBe(BIN);
  });
});

/**
 * @issue DTX-5012
 * `serverSectionToArgs` appends the config's flags after the user's own
 * argv, so an explicit flag wins (both delegated mains take the first
 * occurrence); a value is suppressed entirely when its flag's env mirror is
 * set, and a declared-but-empty env var still suppresses it, so the
 * delegated main sees the empty value and refuses loudly rather than the
 * config papering over it. Precedence: flag > env > config file.
 */
describe('serverSectionToArgs', () => {
  const SECTION = {
    host: '0.0.0.0',
    port: 8099,
    auth: { type: 'static-token' as const, token: 'shh' },
    maxPool: 4,
    blobBudget: 1024,
    keepaliveWindow: 120,
  };

  it('appends a flag per present value, after the user argv', () => {
    expect(serverSectionToArgs(SECTION, [], 'server')).toEqual([
      '--port', '8099',
      '--host', '0.0.0.0',
      '--token', 'shh',
      '--max-pool', '4',
      '--blob-budget', '1024',
      '--keepalive-window', '120',
    ]);
  });

  /**
   * @issue DTX-5013
   * A relay has no device-pool concept at all: `serverSectionToArgs`
   * never emits `--max-pool` for the relay verb, even when the config
   * section carries a `maxPool` value.
   */
  it('the relay verb never receives --max-pool — a relay has no pool concept', () => {
    const merged = serverSectionToArgs(SECTION, [], 'relay');
    expect(merged).not.toContain('--max-pool');
    // Everything else still appends.
    expect(merged).toContain('--host');
    expect(merged).toContain('--token');
  });

  it('skips values the section does not carry', () => {
    expect(serverSectionToArgs({ port: 9000 }, [], 'server')).toEqual(['--port', '9000']);
  });

  it("the user's own flag wins — the section's value is not appended behind it", () => {
    const merged = serverSectionToArgs(SECTION, ['--port', '7777'], 'server');
    expect(merged.slice(0, 2)).toEqual(['--port', '7777']);
    expect(merged.filter((token) => token === '--port')).toHaveLength(1);
    expect(merged).not.toContain('8099');
    // Untouched flags still append.
    expect(merged).toContain('--host');
  });

  it('no section returns the user argv untouched (a copy)', () => {
    const user = ['--port', '1'];
    const merged = serverSectionToArgs(undefined, user, 'server');
    expect(merged).toEqual(user);
    expect(merged).not.toBe(user);
  });

  it('an env mirror suppresses the config value — flag > env > config', () => {
    const merged = serverSectionToArgs(SECTION, [], 'server', {
      DETOX_SERVER_TOKEN: 'ci-secret',
      PORT: '9999',
    });
    // The delegated main will read the env vars itself — the config's values
    // must not arrive as flags and shadow them.
    expect(merged).not.toContain('--token');
    expect(merged).not.toContain('--port');
    // Knobs with no set mirror still flow from the config.
    expect(merged).toContain('--host');
    expect(merged).toContain('--keepalive-window');
  });

  it('a DECLARED-but-empty env token still suppresses the config token — the loud refusal must fire', () => {
    const merged = serverSectionToArgs(SECTION, [], 'server', { DETOX_SERVER_TOKEN: '' });
    expect(merged).not.toContain('--token');
  });

  it('the relay verb reads ITS OWN mirrors — DETOX_SERVER_TOKEN is not the relay token', () => {
    const viaServerVar = serverSectionToArgs(SECTION, [], 'relay', { DETOX_SERVER_TOKEN: 'x' });
    expect(viaServerVar).toContain('--token');
    const viaRelayVar = serverSectionToArgs(SECTION, [], 'relay', { DETOX_RELAY_TOKEN: 'x' });
    expect(viaRelayVar).not.toContain('--token');
  });
});

describe('collectBuildCommands', () => {
  const CONFIG_PATH = '/project/detox.config.js';

  it('returns build strings in config order, skipping apps without one', () => {
    const commands = collectBuildCommands(
      [
        { name: 'a', build: 'xcodebuild -scheme A' },
        { name: 'b' },
        { name: 'c', build: 'xcodebuild -scheme C' },
      ],
      CONFIG_PATH,
    );
    expect(commands).toEqual(['xcodebuild -scheme A', 'xcodebuild -scheme C']);
  });

  it('no app with a build string → UsageError mentioning `build` and the file', () => {
    expect(() => collectBuildCommands([{ name: 'a' }, { name: 'b', build: '' }], CONFIG_PATH)).toThrow(
      UsageError,
    );
    expect(() => collectBuildCommands([{ name: 'a' }], CONFIG_PATH)).toThrow(/`build`/);
    expect(() => collectBuildCommands([{ name: 'a' }], CONFIG_PATH)).toThrow(CONFIG_PATH);
  });
});
