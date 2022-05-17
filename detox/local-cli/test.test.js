// @ts-nocheck
if (process.platform === 'win32') {
  jest.retryTimes(1); // TODO: investigate why it gets stuck for the 1st time on Windows
}

jest.mock('child_process');
jest.mock('node-ipc', () => ({
  default: {
    config: {},
    serve: jest.fn(cb => cb()),
    server: {
      on: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      server: {
        close: jest.fn(cb => cb()),
      },
    },
  },
}));

// TODO: fix this mess with Loggers
jest.mock('../src/utils/logger');
jest.mock('../src/logger/NullLogger', () => class {
  constructor() {
    return require('../src/utils/logger');
  }
});
jest.mock('../realms/root/BunyanLogger', () => class {
  constructor() {
    return require('../src/utils/logger');
  }
});
jest.mock('../src/devices/DeviceRegistry');
jest.mock('../src/devices/allocation/drivers/android/genycloud/GenyDeviceRegistryFactory');
jest.mock('../src/utils/lastFailedTests');
jest.mock('./utils/jestInternals');

const fs = require('fs-extra');
const _ = require('lodash');
const yargs = require('yargs');

const { DEVICE_LAUNCH_ARGS_DEPRECATION } = require('./testCommand/warnings');

describe('CLI', () => {
  let cp;
  let logger;
  let temporaryFiles;
  let detoxConfig;
  let detoxConfigPath;
  let DeviceRegistry;
  let GenyDeviceRegistryFactory;
  let jestInternals;
  let _env;

  beforeEach(() => {
    temporaryFiles = [];
    _env = process.env;
    process.env = { ..._env };

    detoxConfig = {
      configurations: {
        single: {
          device: {
            type: 'ios.simulator',
            device: 'iPhone X'
          },
          apps: [],
        },
      },
    };

    cp = require('child_process');

    const realJestInternals = jest.requireActual('./utils/jestInternals');
    jestInternals = require('./utils/jestInternals');
    Object.assign(jestInternals, realJestInternals);
    jestInternals.readJestConfig = jest.fn(async (argv) => {
      const runnerConfigTemplate = _.omit(
        JSON.parse(require('./templates/jest').runnerConfig),
        ['reporters', 'testEnvironment']
      );

      return realJestInternals.readJestConfig({
        ...argv,
        config: tempfile('.json', JSON.stringify(runnerConfigTemplate)),
      });
    });

    logger = require('../src/utils/logger');
    DeviceRegistry = require('../src/devices/DeviceRegistry');
    DeviceRegistry.forAndroid.mockImplementation(() => new DeviceRegistry());
    DeviceRegistry.forIOS.mockImplementation(() => new DeviceRegistry());
    GenyDeviceRegistryFactory = require('../src/devices/allocation/drivers/android/genycloud/GenyDeviceRegistryFactory');
    GenyDeviceRegistryFactory.forGlobalShutdown.mockImplementation(() => new DeviceRegistry());
  });

  afterEach(async () => {
    process.env = _env;

    await Promise.all(temporaryFiles.map(name => fs.remove(name)));
  });

  describe('by default', () => {
    test('by default, should attempt to load config from package.json or .detoxrc', async () => {
      const expectedError = /^Cannot run Detox without a configuration/;
      await expect(runRaw('test')).rejects.toThrowError(expectedError);
    });
  });

  describe('given no extra args (iOS)', () => {
    beforeEach(async () => {
        singleConfig().device.type = 'ios.simulator';
      await run();
    });

    test('should produce a default command (integration test, ios)', () => {
      expect(cliCall().command).toBe(`jest --config e2e/config.json`);
    });

    test('should put default environment variables (integration test, ios)', () => {
      expect(cliCall().envHint).toEqual({
        DETOX_CONFIG_PATH: expect.any(String),
      });
    });
  });

  describe('given no extra args (Android)', () => {
    beforeEach(async () => {
        singleConfig().device.type = 'android.emulator';
      await run();
    });

    test('should produce a default command (integration test)', () => {
      expect(cliCall().command).toBe(`jest --config e2e/config.json`);
    });

    test('should put default environment variables (integration test)', () => {
      expect(cliCall().envHint).toEqual({
        DETOX_CONFIG_PATH: expect.any(String),
      });
    });
  });

  test('should use runnerConfig.specs as default specs', async () => {
    detoxConfig.specs = 'e2e/sanity';
    await run('');
    expect(cliCall().command).toMatch(/ e2e\/sanity$/);
  });

  test.each([['-o'], ['--runner-config']])('%s <path> should point to the specified Jest config', async (__runnerConfig) => {
    await run(`${__runnerConfig} e2e/custom.config.js`);
    expect(cliCall().command).toContain(`--config e2e/custom.config.js`);
  });

  test.each([['-l'], ['--loglevel']])('%s <value> should be passed as environment variable', async (__loglevel) => {
    await run(`${__loglevel} trace`);
    expect(cliCall().envHint).toEqual(expect.objectContaining({ DETOX_LOGLEVEL: 'trace' }));
  });

  test.each([['-R'], ['--retries']])('%s <value> should execute successful run once', async (__retries) => {
    await run(`-R 1`);
    expect(cliCall(1)).toBe(null);
  });

  test.each([['-R'], ['--retries']])('%s <value> should execute unsuccessful run N extra times', async (__retries) => {
    const context = require('../realms/root');
    jest.spyOn(context, 'lastFailedTests', 'get')
      .mockReturnValueOnce(['e2e/failing1.test.js', 'e2e/failing2.test.js'])
      .mockReturnValueOnce(['e2e/failing2.test.js']);

    cp.execSync.mockImplementation(() => { throw new Error; });

    await run(`-R 2`).catch(_.noop);
    expect(cliCall(0).env).not.toHaveProperty('DETOX_RERUN_INDEX');

    expect(cliCall(1).command).toMatch(/ e2e\/failing1.test.js e2e\/failing2.test.js$/);
    expect(cliCall(1).env.DETOX_RERUN_INDEX).toBe(1);

    expect(cliCall(2).command).toMatch(/ e2e\/failing2.test.js$/);
    expect(cliCall(2).env.DETOX_RERUN_INDEX).toBe(2);
  });

  test.each([['-R'], ['--retries']])('%s <value> should not restart test runner if there are no failing tests paths', async (__retries) => {
    const context = require('../realms/root');
    jest.spyOn(context, 'lastFailedTests', 'get')
      .mockReturnValueOnce([]);
    cp.execSync.mockImplementation(() => { throw new Error; });

    await run(`-R 1`).catch(_.noop);
    expect(cliCall(0)).not.toBe(null);
    expect(cliCall(1)).toBe(null);
  });

  test.each([['-R'], ['--retries']])('%s <value> should retain -- <...explicitPassthroughArgs>', async (__retries) => {
    const context = require('../realms/root');
    jest.spyOn(context, 'lastFailedTests', 'get')
      .mockReturnValueOnce(['tests/failing.test.js']);
    cp.execSync.mockImplementation(() => { throw new Error; });

    await run(`-R 1 tests -- --debug`).catch(_.noop);
    expect(cliCall(0).command).toMatch(/ --debug .* tests$/);
    expect(cliCall(1).command).toMatch(/ --debug .* tests\/failing.test.js$/);
  });

  test.each([['-r'], ['--reuse']])('%s <value> should be passed as environment variable', async (__reuse) => {
    await run(`${__reuse}`);
    expect(cliCall().envHint).toEqual(expect.objectContaining({ DETOX_REUSE: true }));
  });

  test.each([['-u'], ['--cleanup']])('%s <value> should be passed as environment variable', async (__cleanup) => {
    await run(`${__cleanup}`);
    expect(cliCall().envHint).toEqual(expect.objectContaining({ DETOX_CLEANUP: true }));
  });

  test.each([['-d'], ['--debug-synchronization']])('%s <value> should be passed as environment variable', async (__debug_synchronization) => {
    await run(`${__debug_synchronization} 5000`);
    expect(cliCall().envHint).toEqual(expect.objectContaining({ DETOX_DEBUG_SYNCHRONIZATION: 5000 }));
  });

  test.each([['-d'], ['--debug-synchronization']])('%s <value> should be passed as 0 when given false', async (__debug_synchronization) => {
    await run(`${__debug_synchronization} false`);
    expect(cliCall().envHint).toEqual(expect.objectContaining({ DETOX_DEBUG_SYNCHRONIZATION: 0 }));
  });

  test.each([['-d'], ['--debug-synchronization']])('%s <value> should have default value = 3000', async (__debug_synchronization) => {
    await run(`${__debug_synchronization}`);
    expect(cliCall().envHint).toEqual(expect.objectContaining({ DETOX_DEBUG_SYNCHRONIZATION: 3000 }));
  });

  test.each([['-a'], ['--artifacts-location']])('%s <value> should be passed as environment variable', async (__artifacts_location) => {
    await run(`${__artifacts_location} /tmp`);
    expect(cliCall().envHint).toEqual(expect.objectContaining({ DETOX_ARTIFACTS_LOCATION: '/tmp' }));
  });

  test('--record-logs <value> should be passed as environment variable', async () => {
    await run(`--record-logs all`);
    expect(cliCall().envHint).toEqual(expect.objectContaining({ DETOX_RECORD_LOGS: 'all' }));
  });

  test('--take-screenshots <value> should be passed as environment variable', async () => {
    await run(`--take-screenshots failing`);
    expect(cliCall().envHint).toEqual(expect.objectContaining({ DETOX_TAKE_SCREENSHOTS: 'failing' }));
  });

  test('--record-videos <value> should be passed as environment variable', async () => {
    await run(`--record-videos failing`);
    expect(cliCall().envHint).toEqual(expect.objectContaining({ DETOX_RECORD_VIDEOS: 'failing' }));
  });

  test('--record-performance <value> should be passed as environment variable', async () => {
    await run(`--record-performance all`);
    expect(cliCall().envHint).toEqual(expect.objectContaining({ DETOX_RECORD_PERFORMANCE: 'all' }));
  });

  test('--record-timeline <value> should be passed as environment variable', async () => {
    await run(`--record-timeline all`);
    expect(cliCall().envHint).toEqual(expect.objectContaining({ DETOX_RECORD_TIMELINE: 'all' }));
  });

  test('--capture-view-hierarchy <value> should be passed as environment variable', async () => {
    await run(`--capture-view-hierarchy enabled`);
    expect(cliCall().envHint).toEqual(expect.objectContaining({ DETOX_CAPTURE_VIEW_HIERARCHY: 'enabled' }));
  });

  test('--jest-report-specs, set explicitly, should be passed as an environment variable', async () => {
    await run('--jest-report-specs');
    expect(cliCall().envHint).toEqual(expect.objectContaining({ DETOX_REPORT_SPECS: true }));
  });

  test.each([['-H'], ['--headless']])('%s <value> should be passed as environment variable', async (__headless) => {
    await run(`${__headless}`);
    expect(cliCall().envHint).toEqual(expect.objectContaining({ DETOX_HEADLESS: true }));
  });

  test('--gpu <value> should be passed as environment variable', async () => {
    await run(`--gpu angle_indirect`);
    expect(cliCall().envHint).toEqual(expect.objectContaining({ DETOX_GPU: 'angle_indirect' }));
  });

  test('--device-boot-args should be passed as an environment variable (without deprecation warnings)', async () => {
    await run(`--device-boot-args "--verbose"`);
    expect(cliCall().envHint).toEqual(expect.objectContaining({
      DETOX_DEVICE_BOOT_ARGS: '--verbose'
    }));
    expect(logger.warn).not.toHaveBeenCalledWith(DEVICE_LAUNCH_ARGS_DEPRECATION);
  });

  test('--device-launch-args should serve as a deprecated alias to --device-boot-args', async () => {
    await run(`--device-launch-args "--verbose"`);
    expect(cliCall().envHint.DETOX_DEVICE_BOOT_ARGS).toBe('--verbose');
    expect(logger.warn).toHaveBeenCalledWith(DEVICE_LAUNCH_ARGS_DEPRECATION);
  });

  test('--app-launch-args should be passed as an environment variable', async () => {
    await run(`--app-launch-args "--debug yes"`);
    expect(cliCall().envHint).toEqual(expect.objectContaining({
      DETOX_APP_LAUNCH_ARGS: '--debug yes',
    }));
  });

  test('--use-custom-logger false should be prevent passing environment variable', async () => {
    await run(`--use-custom-logger false`);
    expect(cliCall().envHint).toEqual(expect.objectContaining({
      DETOX_USE_CUSTOM_LOGGER: false
    }));
  });

  test('--force-adb-install should be ignored for iOS', async () => {
      singleConfig().device.type = 'ios.simulator';
    await run(`--force-adb-install`);
    expect(cliCall().envHint).not.toHaveProperty('DETOX_FORCE_ADB_INSTALL');
  });

  test('--force-adb-install should be passed as environment variable', async () => {
      singleConfig().device.type = 'android.emulator';
    await run(`--force-adb-install`);
    expect(cliCall().envHint).toEqual(expect.objectContaining({
      DETOX_FORCE_ADB_INSTALL: true,
    }));
  });

  test.each([['-n'], ['--device-name']])('%s <value> should be passed as environment variable', async (__device_name) => {
    await run(`${__device_name} TheDevice`);
    expect(cliCall().envHint).toEqual(expect.objectContaining({
      DETOX_DEVICE_NAME: 'TheDevice',
    }));
  });

  test('specifying direct test paths', async () => {
    await run(`e2e/01.sanity.test.js e2e/02.sanity.test.js`);
    expect(cliCall().command).not.toMatch(/ e2e /);
    expect(cliCall().command).not.toMatch(/ e2e$/);
    expect(cliCall().command).toMatch(/ e2e\/01.sanity.test.js e2e\/02.sanity.test.js$/);
  });

  // TODO: fix --inspect-brk behavior on Windows, and replace (cmd|js) with js here
  test.each([
    ['--inspect-brk e2eFolder', /^node --inspect-brk \.\/node_modules\/.*jest.* .* e2eFolder$/, {}],
    ['-d e2eFolder', / e2eFolder$/, { DETOX_DEBUG_SYNCHRONIZATION: 3000 }],
    ['--debug-synchronization e2eFolder', / e2eFolder$/, { DETOX_DEBUG_SYNCHRONIZATION: 3000 }],
    ['-r e2eFolder', / e2eFolder$/, { DETOX_REUSE: true }],
    ['--reuse e2eFolder', / e2eFolder$/, { DETOX_REUSE: true }],
    ['-u e2eFolder', / e2eFolder$/, { DETOX_CLEANUP: true }],
    ['--cleanup e2eFolder', / e2eFolder$/, { DETOX_CLEANUP: true }],
    ['--jest-report-specs e2eFolder', / e2eFolder$/, { DETOX_REPORT_SPECS: true }],
    ['-H e2eFolder', / e2eFolder$/, { DETOX_HEADLESS: true }],
    ['--headless e2eFolder', / e2eFolder$/, { DETOX_HEADLESS: true }],
    ['--keepLockFile e2eFolder', / e2eFolder$/, {}],
    ['--use-custom-logger e2eFolder', / e2eFolder$/, { DETOX_USE_CUSTOM_LOGGER: true }],
    ['--force-adb-install e2eFolder', / e2eFolder$/, { DETOX_FORCE_ADB_INSTALL: true }],
  ])('"%s" should be disambigued correctly', async (command, commandMatcher, envMatcher) => {
      singleConfig().device.type = 'android.emulator';
    await run(command);

    expect(cliCall().command).toMatch(commandMatcher);
    expect(cliCall().envHint).toEqual(expect.objectContaining(envMatcher));
  });

  test('e.g., --debug should be passed through', async () => {
    await run(`--debug`);
    expect(cliCall().command).toContain('--debug');
  });

  test('e.g., --coverageProvider v8 should be passed through', async () => {
    await run(`--coverageProvider v8`);
    expect(cliCall().command).toContain('--coverageProvider v8');
  });

  test('e.g., --debug e2e/Login.test.js should be split to --debug and e2e/Login.test.js', async () => {
    await run(`--debug e2e/Login.test.js --coverageProvider v8`);
    expect(cliCall().command).toMatch(/--debug --coverageProvider v8 e2e\/Login.test.js$/);
  });

  test.each([
    [`"e2e tests/first test.spec.js"`, `"e2e tests/first test.spec.js"`],
  ])('should escape %s when forwarding it as a CLI argument', async (cmd, expected) => {
    await run(cmd);
    expect(cliCall().command).toContain(` ${expected}`);
  });

  test(`should be able to use custom test runner commands`, async () => {
    detoxConfig.testRunner = `nyc jest`;
    await run();
    expect(cliCall().command).toMatch(RegExp(`nyc jest `));
  });

  test('-- <...explicitPassthroughArgs> should be forwarded to the test runner CLI as-is', async () => {
    await run('--device-boot-args detoxArgs e2eFolder -- a -a --a --device-boot-args runnerArgs');
    expect(cliCall().command).toMatch(/a -a --a --device-boot-args runnerArgs .* e2eFolder$/);
    expect(cliCall().envHint).toEqual(expect.objectContaining({ DETOX_DEVICE_BOOT_ARGS: 'detoxArgs' }));
  });

  test('-- <...explicitPassthroughArgs> should omit double-dash "--" itself, when forwarding args', async () => {
    await run('./detox -- --forceExit');

    expect(cliCall().command).toMatch(/ --forceExit .* \.\/detox$/);
    expect(cliCall().command).not.toMatch(/ -- --forceExit .* \.\/detox$/);
  });

  test('--inspect-brk should prepend "node --inspect-brk" to the command', async () => {
    await run('--inspect-brk');

    if (process.platform === 'win32') {
      expect(cliCall().command).toMatch(/^node --inspect-brk \.\/node_modules\/jest\/bin\/jest\.js/);
    } else {
      expect(cliCall().command).toMatch(/^node --inspect-brk \.\/node_modules\/\.bin\/jest/);
    }
  });

  test('should append $DETOX_ARGV_OVERRIDE to detox test ... command and print a warning', async () => {
    process.env.PLATFORM = 'ios';
    process.env.DETOX_ARGV_OVERRIDE = '--inspect-brk --testNamePattern "[$PLATFORM] tap" e2e/sanity/*.test.js';
    await run();

    const pattern = new RegExp(`^node --inspect-brk.* --testNamePattern ${quote('\\[ios\\] tap')}.* e2e/sanity/\\*\\.test.js$`);

    expect(cliCall().command).toMatch(pattern);
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('$DETOX_ARGV_OVERRIDE is detected'));
  });

  // Helpers

  function tempfile(extension, content) {
    const tempFilePath = require('tempfile')(extension);

    fs.ensureFileSync(tempFilePath);
    if (content) {
      fs.writeFileSync(tempFilePath, content);
    }

    temporaryFiles.push(tempFilePath);
    return tempFilePath;
  }

  async function runRaw(command = '') {
    let argv;

    try {
      argv = process.argv.splice(2, Infinity, ...command.trim().split(' '));

      return await new Promise((resolve, reject) => {
        const testCommand = require('./test');
        const originalHandler = testCommand.handler;

        const parser = yargs()
          .scriptName('detox')
          .parserConfiguration({
            'boolean-negation': false,
            'camel-case-expansion': false,
            'dot-notation': false,
            'duplicate-arguments-array': false,
            'populate--': true,
          })
          .command({
            ...testCommand,
            async handler(argv) {
              try {
                await originalHandler(argv);
                resolve();
              } catch (e) {
                reject(e);
              }
            },
          })
          .wrap(null);

        parser.parse(command, err => err && reject(err));
      });
    } finally {
      argv && process.argv.splice(2, Infinity, ...argv);
    }
  }

  async function run(command = '') {
    detoxConfigPath = tempfile('.json', JSON.stringify(detoxConfig));
    const __configPath = Math.random() > 0.5 ? '-C' : '--config-path';
    return runRaw(`test ${__configPath} ${detoxConfigPath} ${command}`);
  }

  function cliCall(index = 0) {
    const mockCall = cp.execSync.mock.calls[index];
    if (!mockCall) {
      return null;
    }

    const [command, opts] = mockCall;

    const envHint = _.chain(logger)
      .thru(({ log }) => log.mock.calls)
      .map(([_level, _childMeta, meta]) => meta && meta.env)
      .filter(Boolean)
      .get(index)
      .value();

    return {
      command,
      env: _.omitBy(opts.env, (_value, key) => key in process.env),
      envHint,
    };
  }

  function singleConfig() {
    return Object.values(detoxConfig.configurations)[0];
  }

  function isInCMD() {
    return process.platform === 'win32' && !process.env.SHELL;
  }

  function quote(s, q = isInCMD() ? `"` : `'`) {
    return q + s + q;
  }
});
