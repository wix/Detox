// @ts-nocheck
if (process.platform === 'win32') {
  jest.retryTimes(1); // TODO: investigate why it gets stuck for the 1st time on Windows
}

jest.mock('../src/logger/DetoxLogger');
jest.mock('../src/devices/DeviceRegistry');
jest.mock('../src/devices/allocation/drivers/android/genycloud/GenyDeviceRegistryFactory');
jest.mock('./utils/jestInternals');

const os = require('os');
const path = require('path');

const fs = require('fs-extra');
const _ = require('lodash');
const yargs = require('yargs');

const { DEVICE_LAUNCH_ARGS_DEPRECATION } = require('./testCommand/warnings');

describe('CLI', () => {
  let _cliCallDump;
  let _env;
  let logger;
  let _temporaryFiles;
  let detoxConfig;
  let detoxConfigPath;
  let DeviceRegistry;
  let GenyDeviceRegistryFactory;
  let jestInternals;

  beforeEach(() => {
    _cliCallDump = undefined;
    _env = process.env;
    _temporaryFiles = [];

    process.env = {
      ..._env,
      CLI_TEST_STDOUT: tempfile('.txt'),
    };

    const executable = path.relative(process.cwd(), path.join(__dirname, '__mocks__/executable'));

    detoxConfig = {
      testRunner: {
        args: {
          $0: os.platform() === 'win32' ? `node ${executable}` : executable,
          config: 'e2e/config.json'
        },
      },
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

    logger = () => require('../src/logger/DetoxLogger').instances[0];
    DeviceRegistry = require('../src/devices/DeviceRegistry');
    DeviceRegistry.forAndroid.mockImplementation(() => new DeviceRegistry());
    DeviceRegistry.forIOS.mockImplementation(() => new DeviceRegistry());
    GenyDeviceRegistryFactory = require('../src/devices/allocation/drivers/android/genycloud/GenyDeviceRegistryFactory');
    GenyDeviceRegistryFactory.forGlobalShutdown.mockImplementation(() => new DeviceRegistry());
  });

  afterEach(async () => {
    process.env = _env;

    await Promise.all(_temporaryFiles.map(name => fs.remove(name)));
  });

  describe('by default', () => {
    test('by default, should attempt to load config from package.json or .detoxrc', async () => {
      const expectedError = /^Cannot run Detox without a configuration/;
      await expect(runRaw('test')).rejects.toThrowError(expectedError);
    });
  });

  describe.each([
    ['iOS', 'ios.simulator'],
    ['Android', 'android.emulator'],
  ])('given no extra args (%s)', (_platform, deviceType) => {
    beforeEach(async () => {
      singleConfig().device.type = deviceType;
      await run();
    });

    test('should produce a default command', () => {
      expect(cliCall().argv).toEqual([expect.stringContaining('executable'), '--config', 'e2e/config.json']);
    });

    test('should not override environment variables', () => {
      expect(cliCall().env).toEqual({ DETOX_CONFIG_SNAPSHOT_PATH: expect.any(String) });
    });

    test('should hint essential environment variables', () => {
      expect(cliCall().fullCommand).toMatch(/^DETOX_CONFIG_PATH=.*\bexecutable/);
    });
  });

  test('should use runnerConfig.specs as default specs', async () => {
    detoxConfig.testRunner.args._ = ['e2e/sanity'];
    await run();
    expect(_.last(cliCall().argv)).toEqual('e2e/sanity');
  });

  test.each([['--config']])('%s <path> should point to the specified Jest config', async (__runnerConfig) => {
    await run(__runnerConfig, 'e2e/custom.config.js');
    expect(cliCall().argv).toEqual([expect.stringContaining('executable'), '--config', 'e2e/custom.config.js']);
  });

  test.each([['-l'], ['--loglevel']])('%s <value> should be passed as environment variable', async (__loglevel) => {
    await run(__loglevel, 'trace');
    expect(cliCall().env).not.toHaveProperty('DETOX_LOGLEVEL');
    expect(cliCall().fullCommand).toMatch(/ DETOX_LOGLEVEL="trace" /);
  });

  test.each([['-R'], ['--retries']])('%s <value> should execute successful run once', async (__retries) => {
    await run(__retries, 1);
    expect(cliCall(1)).toBe(null);
  });

  test.each([['-R'], ['--retries']])('%s <value> should execute unsuccessful run N extra times', async (__retries) => {
    const context = require('../internals');
    context.session.failedTestFiles = ['e2e/failing1.test.js', 'e2e/failing2.test.js'];
    context.reportFailedTests = jest.fn(() => {
      context.session.failedTestFiles = ['e2e/failing2.test.js'];
    });

    mockExitCode(1);

    await run(__retries, 2).catch(_.noop);

    expect(cliCall(0).env).not.toHaveProperty('DETOX_RERUN_INDEX');
    expect(cliCall(0).argv).toEqual([expect.stringMatching(/executable$/), '--config', 'e2e/config.json']);
    expect(cliCall(0).fullCommand).not.toMatch(/DETOX_RERUN_INDEX/);

    expect(cliCall(1).env.DETOX_RERUN_INDEX).toBe('1');
    expect(cliCall(1).argv).toEqual([expect.stringMatching(/executable$/), '--config', 'e2e/config.json', 'e2e/failing1.test.js', 'e2e/failing2.test.js']);
    expect(cliCall(1).fullCommand).not.toMatch(/DETOX_RERUN_INDEX/);

    expect(cliCall(2).argv).toEqual([expect.stringMatching(/executable$/), '--config', 'e2e/config.json', 'e2e/failing2.test.js']);
    expect(cliCall(2).env.DETOX_RERUN_INDEX).toBe('2');
    expect(cliCall(2).fullCommand).not.toMatch(/DETOX_RERUN_INDEX/);
  });

  test.each([['-R'], ['--retries']])('%s <value> should not restart test runner if there are no failing tests paths', async (__retries) => {
    mockExitCode(1);

    await run(__retries, 1).catch(_.noop);
    expect(cliCall(0)).not.toBe(null);
    expect(cliCall(1)).toBe(null);
  });

  test.each([['-R'], ['--retries']])('%s <value> should retain -- <...explicitPassthroughArgs>', async (__retries) => {
    const context = require('../internals');
    context.session.failedTestFiles = ['tests/failing.test.js'];

    mockExitCode(1);

    await run(__retries, 1, 'tests', '--', '--debug').catch(_.noop);

    expect(cliCall(0).argv).toEqual([expect.stringMatching(/executable$/), '--config', 'e2e/config.json', '--debug', 'tests']);
    expect(cliCall(1).argv).toEqual([expect.stringMatching(/executable$/), '--config', 'e2e/config.json', '--debug', 'tests/failing.test.js']);
  });

  test.each([['-r'], ['--reuse']])('%s <value> should be passed as environment variable', async (__reuse) => {
    await run(__reuse);
    expect(cliCall().env).not.toHaveProperty('DETOX_REUSE');
    expect(cliCall().fullCommand).toMatch(/\bDETOX_REUSE=true /);
  });

  test.each([['-u'], ['--cleanup']])('%s <value> should be passed as environment variable', async (__cleanup) => {
    await run(__cleanup);
    expect(cliCall().env).not.toHaveProperty('DETOX_CLEANUP');
    expect(cliCall().fullCommand).toMatch(/\bDETOX_CLEANUP=true /);
  });

  test.each([['-d'], ['--debug-synchronization']])('%s <value> should be passed as environment variable', async (__debug_synchronization) => {
    await run(__debug_synchronization, 5000);
    expect(cliCall().env).not.toHaveProperty('DETOX_DEBUG_SYNCHRONIZATION');
    expect(cliCall().fullCommand).toMatch(/\bDETOX_DEBUG_SYNCHRONIZATION=5000 /);
  });

  test.each([['-d'], ['--debug-synchronization']])('%s <value> should be passed as 0 when given false', async (__debug_synchronization) => {
    await run(__debug_synchronization, false);
    expect(cliCall().env).not.toHaveProperty('DETOX_DEBUG_SYNCHRONIZATION');
    expect(cliCall().fullCommand).toMatch(/\bDETOX_DEBUG_SYNCHRONIZATION=0 /);
  });

  test.each([['-d'], ['--debug-synchronization']])('%s <value> should have default value = 3000', async (__debug_synchronization) => {
    await run(`${__debug_synchronization}`);
    expect(cliCall().env).not.toHaveProperty('DETOX_DEBUG_SYNCHRONIZATION');
    expect(cliCall().fullCommand).toMatch(/\bDETOX_DEBUG_SYNCHRONIZATION=3000 /);
  });

  test.each([['-a'], ['--artifacts-location']])('%s <value> should be passed as environment variable', async (__artifacts_location) => {
    await run(__artifacts_location, '/tmp');
    expect(cliCall().env).not.toHaveProperty('DETOX_ARTIFACTS_LOCATION');
    expect(cliCall().fullCommand).toMatch(/\bDETOX_ARTIFACTS_LOCATION="\/tmp" /);
  });

  test('--record-logs <value> should be passed as environment variable', async () => {
    await run('--record-logs', 'all');
    expect(cliCall().env).not.toHaveProperty('DETOX_RECORD_LOGS');
    expect(cliCall().fullCommand).toMatch(/\bDETOX_RECORD_LOGS="all" /);
  });

  test('--take-screenshots <value> should be passed as environment variable', async () => {
    await run('--take-screenshots', 'failing');
    expect(cliCall().env).not.toHaveProperty('DETOX_TAKE_SCREENSHOTS');
    expect(cliCall().fullCommand).toMatch(/\bDETOX_TAKE_SCREENSHOTS="failing" /);
  });

  test('--record-videos <value> should be passed as environment variable', async () => {
    await run('--record-videos', 'failing');
    expect(cliCall().env).not.toHaveProperty('DETOX_RECORD_VIDEOS');
    expect(cliCall().fullCommand).toMatch(/\bDETOX_RECORD_VIDEOS="failing" /);
  });

  test('--record-performance <value> should be passed as environment variable', async () => {
    await run('--record-performance', 'all');
    expect(cliCall().env).not.toHaveProperty('DETOX_RECORD_PERFORMANCE');
    expect(cliCall().fullCommand).toMatch(/\DETOX_RECORD_PERFORMANCE="all" /);
  });

  test('--capture-view-hierarchy <value> should be passed as environment variable', async () => {
    await run('--capture-view-hierarchy', 'enabled');
    expect(cliCall().env).not.toHaveProperty('DETOX_CAPTURE_VIEW_HIERARCHY');
    expect(cliCall().fullCommand).toMatch(/\DETOX_CAPTURE_VIEW_HIERARCHY="enabled" /);
  });

  test('--jest-report-specs, set explicitly, should be passed as an environment variable', async () => {
    await run('--jest-report-specs');
    expect(cliCall().env).not.toHaveProperty('DETOX_REPORT_SPECS');
    expect(cliCall().fullCommand).toMatch(/\bDETOX_REPORT_SPECS=true /);
  });

  test.each([['-H'], ['--headless']])('%s <value> should be passed as environment variable', async (__headless) => {
    await run(__headless);
    expect(cliCall().env).not.toHaveProperty('DETOX_HEADLESS');
    expect(cliCall().fullCommand).toMatch(/\bDETOX_HEADLESS=true /);
  });

  test('--gpu <value> should be passed as environment variable', async () => {
    await run('--gpu', 'angle_indirect');
    expect(cliCall().env).not.toHaveProperty('DETOX_GPU');
    expect(cliCall().fullCommand).toMatch(/\bDETOX_GPU="angle_indirect" /);
  });

  test('--device-boot-args should be passed as an environment variable (without deprecation warnings)', async () => {
    await run('--device-boot-args="--verbose"');
    expect(cliCall().env).not.toHaveProperty('DETOX_DEVICE_BOOT_ARGS');
    expect(cliCall().fullCommand).toMatch(/\bDETOX_DEVICE_BOOT_ARGS="--verbose" /);
    expect(logger().warn).not.toHaveBeenCalledWith(DEVICE_LAUNCH_ARGS_DEPRECATION);
  });

  test('--device-launch-args should serve as a deprecated alias to --device-boot-args', async () => {
    await run(`--device-launch-args="--verbose"`);
    expect(cliCall().env).not.toHaveProperty('DETOX_DEVICE_BOOT_ARGS');
    expect(cliCall().fullCommand).toMatch(/\bDETOX_DEVICE_BOOT_ARGS="--verbose" /);
    expect(logger().warn).toHaveBeenCalledWith(DEVICE_LAUNCH_ARGS_DEPRECATION);
  });

  test('--app-launch-args should be passed as an environment variable', async () => {
    await run(`--app-launch-args="--debug yes"`);
    expect(cliCall().env).not.toHaveProperty('DETOX_APP_LAUNCH_ARGS');
    expect(cliCall().fullCommand).toMatch(/\bDETOX_APP_LAUNCH_ARGS="--debug yes" /);
  });

  test('--use-custom-logger false should be prevent passing environment variable', async () => {
    await run(`--use-custom-logger=false`);
    expect(cliCall().env).not.toHaveProperty('DETOX_USE_CUSTOM_LOGGER');
    expect(cliCall().fullCommand).toMatch(/\bDETOX_USE_CUSTOM_LOGGER=false /);
  });

  test('--force-adb-install should be ignored for iOS', async () => {
    singleConfig().device.type = 'ios.simulator';
    await run(`--force-adb-install`);
    expect(cliCall().env).not.toHaveProperty('DETOX_FORCE_ADB_INSTALL');
    expect(cliCall().fullCommand).not.toMatch(/DETOX_FORCE_ADB_INSTALL/);
  });

  test('--force-adb-install should be passed as environment variable', async () => {
    singleConfig().device.type = 'android.emulator';
    await run(`--force-adb-install`);
    expect(cliCall().env).not.toHaveProperty('DETOX_FORCE_ADB_INSTALL');
    expect(cliCall().fullCommand).toMatch(/\bDETOX_FORCE_ADB_INSTALL=true /);
  });

  test.each([['-n'], ['--device-name']])('%s <value> should be passed as environment variable', async (__device_name) => {
    await run(__device_name, 'TheDevice');
    expect(cliCall().env).not.toHaveProperty('DETOX_DEVICE_NAME');
    expect(cliCall().fullCommand).toMatch(/\bDETOX_DEVICE_NAME="TheDevice" /);
  });

  test('specifying direct test paths instead of default _', async () => {
    detoxConfig.testRunner.args._ = ['e2e'];

    await run();
    await run('e2e/01.sanity.test.js', 'e2e/02.sanity.test.js');

    expect(cliCall(0).argv).toContain('e2e');
    expect(cliCall(1).argv).not.toContain('e2e');
    expect(cliCall(1).argv.slice(-2)).toEqual(['e2e/01.sanity.test.js', 'e2e/02.sanity.test.js']);
  });

  test.todo('--inspect-brk should work');

  test.each([
    ['-d e2eFolder', / e2eFolder$/, /\bDETOX_DEBUG_SYNCHRONIZATION=3000/],
    ['--debug-synchronization e2eFolder', / e2eFolder$/, /\bDETOX_DEBUG_SYNCHRONIZATION=3000/],
    ['-r e2eFolder', / e2eFolder$/, /\bDETOX_REUSE=true/],
    ['--reuse e2eFolder', / e2eFolder$/, /\bDETOX_REUSE=true/],
    ['-u e2eFolder', / e2eFolder$/, /\bDETOX_CLEANUP=true/],
    ['--cleanup e2eFolder', / e2eFolder$/, /\bDETOX_CLEANUP=true/],
    ['--jest-report-specs e2eFolder', / e2eFolder$/, /\bDETOX_REPORT_SPECS=true/],
    ['-H e2eFolder', / e2eFolder$/, /\bDETOX_HEADLESS=true/],
    ['--headless e2eFolder', / e2eFolder$/, /\bDETOX_HEADLESS=true/],
    ['--keepLockFile e2eFolder', / e2eFolder$/, /\bDETOX_KEEP_LOCKFILE=true/],
    ['--use-custom-logger e2eFolder', / e2eFolder$/, /\bDETOX_USE_CUSTOM_LOGGER=true/],
    ['--force-adb-install e2eFolder', / e2eFolder$/, /\bDETOX_FORCE_ADB_INSTALL=true/],
  ])('"%s" should be disambigued correctly', async (command, commandMatcher, envMatcher) => {
    singleConfig().device.type = 'android.emulator';
    await run(...command.split(' '));

    expect(cliCall().argv.join(' ')).toMatch(commandMatcher);
    expect(cliCall().fullCommand).toEqual(expect.objectContaining(envMatcher));
  });

  test('e.g., --debug should be passed through', async () => {
    await run(`--debug`);
    expect(cliCall().argv).toContain('--debug');
  });

  test('e.g., --coverageProvider v8 should be passed through', async () => {
    await run('--coverageProvider', 'v8');
    expect(cliCall().argv.slice(-2)).toEqual(['--coverageProvider', 'v8']);
  });

  test('e.g., --debug e2e/Login.test.js should be split to --debug and e2e/Login.test.js', async () => {
    await run('--debug', 'e2e/Login.test.js', '--coverageProvider', 'v8');

    expect(cliCall().argv).toEqual([
      expect.stringMatching(/executable$/),
      '--config', 'e2e/config.json',
      '--debug',
      '--coverageProvider', 'v8',
      'e2e/Login.test.js'
    ]);
  });

  test('should escape whitespaces when forwarding a CLI argument', async () => {
    await run(`e2e tests/first test.spec.js`);
    expect(_.last(cliCall().argv)).toEqual(`e2e tests/first test.spec.js`);
  });

  test(`should be able to use custom test runner commands`, async () => {
    detoxConfig.testRunner.args.$0 += ' --hello';
    await run();
    expect(cliCall().argv).toContain('--hello');
  });

  test('-- <...explicitPassthroughArgs> should be forwarded to the test runner CLI as-is', async () => {
    await run('--device-boot-args', 'detoxArgs', 'e2eFolder', '--', 'a', '-a', '--a', '--device-boot-args', 'runnerArgs');
    expect(cliCall().argv).toEqual([
      expect.stringMatching(/executable$/),
      '--config', 'e2e/config.json',
      'a',
      '-a',
      '--a',
      '--device-boot-args',
      'runnerArgs',
      'e2eFolder',
    ]);

    expect(cliCall().fullCommand).toMatch(/\bDETOX_DEVICE_BOOT_ARGS="detoxArgs" /);
  });

  test('-- <...explicitPassthroughArgs> should omit double-dash "--" only once when forwarding args', async () => {
    await run('--', '--', '--deepParameter');

    expect(cliCall().argv).toContain('--');
    expect(cliCall().argv).toContain('--deepParameter');
  });

  // TODO: revive this test
  test.skip('--inspect-brk should prepend "node --inspect-brk" to the command', async () => {
    await run('--inspect-brk');

    if (process.platform === 'win32') {
      expect(cliCall().argv).toMatch(/^node --inspect-brk \.\/node_modules\/jest\/bin\/jest\.js/);
    } else {
      expect(cliCall().argv).toMatch(/^node --inspect-brk \.\/node_modules\/\.bin\/jest/);
    }
  });

  test('should append $DETOX_ARGV_OVERRIDE to detox test ... command and print a warning', async () => {
    process.env.PLATFORM = 'ios';
    process.env.DETOX_ARGV_OVERRIDE = '--testNamePattern="[$PLATFORM] tap" -l trace e2e/sanity/*.test.js';
    await run();

    expect(cliCall().fullCommand).toMatch(/\bDETOX_LOGLEVEL="trace" /);
    expect(cliCall().argv.slice(-3)).toEqual(['--testNamePattern', '[ios] tap', 'e2e/sanity/*.test.js']);
    expect(logger().warn).toHaveBeenCalledWith(expect.stringContaining('$DETOX_ARGV_OVERRIDE is detected'));
  });

  // Helpers

  function tempfile(extension, content) {
    const tempFilePath = require('tempfile')(extension);

    fs.ensureFileSync(tempFilePath);
    if (content) {
      fs.writeFileSync(tempFilePath, content);
    }

    _temporaryFiles.push(tempFilePath);
    return tempFilePath;
  }

  async function runRaw(...command) {
    let memArgv;

    try {
      memArgv = process.argv.splice(2, Infinity, ...command);

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
      memArgv && process.argv.splice(2, Infinity, ...memArgv);
    }
  }

  async function run(...args) {
    detoxConfigPath = tempfile('.json', JSON.stringify(detoxConfig));
    const __configPath = Math.random() > 0.5 ? '-C' : '--config-path';
    return runRaw('test', __configPath, detoxConfigPath, ...args);
  }

  function cliCall(index = 0) {
    if (!_cliCallDump) {
      _cliCallDump = fs.readFileSync(process.env.CLI_TEST_STDOUT, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map(line => JSON.parse(line));
    }

    const mockCall = _cliCallDump[index];
    if (!mockCall) {
      return null;
    }

    return {
      ...mockCall,
      fullCommand: _.chain(logger().log.mock.calls)
        .filter(([_level, _childMeta, meta]) => meta && meta.event === 'RUN_START')
        .get(index)
        .get(3)
        .value(),
    };
  }

  function singleConfig() {
    return Object.values(detoxConfig.configurations)[0];
  }

  function mockExitCode(code) {
    process.env.CLI_EXIT_CODE = code;
  }
});
