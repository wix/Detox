jest.mock('child_process');
jest.mock('../src/utils/logger');
jest.mock('../src/devices/DeviceRegistry');
jest.mock('../src/utils/lastFailedTests');

const _ = require('lodash');
const fs = require('fs-extra');
const yargs = require('yargs');

describe('CLI', () => {
  let cp;
  let logger;
  let temporaryFiles;
  let detoxConfig;
  let detoxConfigPath;
  let DeviceRegistry;
  let _env;

  beforeEach(() => {
    _env = process.env;
    process.env = { ..._env };

    detoxConfig = {
      configurations: {
        single: {
          type: 'ios.simulator',
          device: 'iPhone X',
        },
      },
    };

    cp = require('child_process');
    logger = require('../src/utils/logger');
    temporaryFiles = [];
    DeviceRegistry = require('../src/devices/DeviceRegistry')
    DeviceRegistry.forAndroid = DeviceRegistry.forIOS = DeviceRegistry.forGenyCloudCleanup = () => new DeviceRegistry();
  });

  afterEach(async () => {
    process.env = _env;

    await Promise.all(temporaryFiles.map(name => fs.remove(name)));
  });

  test('by default, should attempt to load config from package.json or .detoxrc', async () => {
    const expectedError = /^Cannot run Detox without a configuration/;
    await expect(runRaw('test')).rejects.toThrowError(expectedError);
  });

  describe('(mocha)', () => {
    describe('given no extra args', () => {
      beforeEach(async () => run());

      test('should default to mocha', () => expect(cliCall().command).toMatch(/^mocha/));
      test('should default to --opts e2e/mocha.opts', () => expect(cliCall().command).toMatch(/--opts e2e\/mocha.opts/));
      test('should default to "e2e" test folder', () => expect(cliCall().command).toMatch(/ e2e$/));
      test('should pass --use-custom-logger true', () => expect(cliCall().command).toMatch(/--use-custom-logger true/));
      test('should not override process.env', () => expect(cliCall().env).toStrictEqual({}));
      test('should produce a default command (integration test)', () => {
        const quoteChar = !isInCMD() && detoxConfigPath.indexOf('\\') >= 0 ? `'` : '';
        const args = [
          `--opts`, `e2e/mocha.opts`,
          `--grep`, `:android:`, `--invert`,
          `--config-path`, quote(detoxConfigPath, quoteChar),
          `--use-custom-logger`, `true`
        ].join(' ');

        expect(cliCall().command).toBe(`mocha ${args} e2e`);
      });
    });

    test.each([['-o'], ['--runner-config']])('%s <path> should be aware of mocha.opts extension', async (__runnerConfig) => {
      await run(`${__runnerConfig} e2e/custom.opts`);
      expect(cliCall().command).toContain(`--opts e2e/custom.opts`);
    });

    test.each([['-o'], ['--runner-config']])('%s <path> should be aware of .mocharc extension', async (__runnerConfig) => {
      await run(`${__runnerConfig} e2e/.mocharc`);
      expect(cliCall().command).toContain(`--config e2e/.mocharc`);
    });

    test.each([['-l'], ['--loglevel']])('%s <value> should be passed as CLI argument', async (__loglevel) => {
      await run(`${__loglevel} verbose`);
      expect(cliCall().command).toContain(`--loglevel verbose`);
    });

    test('--no-color should be passed as CLI argument', async () => {
      await run(`--no-color`);
      expect(cliCall().command).toContain(' --no-colors ');
    });

    test.each([['-R'], ['--retries']])('%s <value> should print warning', async (__retries) => {
      await run(`${__retries} 1`);
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Cannot use -R, --retries.'));
    });

    test.each([['-R'], ['--retries']])('%s <value> should be ignored', async (__retries) => {
      cp.execSync.mockImplementation(() => { throw new Error });
      await run(`${__retries} 1`).catch(_.noop);

      expect(cliCall(0)).toBeDefined()
      expect(cliCall(1)).toBe(null);
    });

    test.each([['-r'], ['--reuse']])('%s <value> should be passed as CLI argument', async (__reuse) => {
      await run(`${__reuse}`);
      expect(cliCall().command).toContain('--reuse')
    });

    test.each([['-u'], ['--cleanup']])('%s <value> should be passed as CLI argument', async (__cleanup) => {
      await run(`${__cleanup}`);
      expect(cliCall().command).toContain('--cleanup')
    });

    test.each([['-d'], ['--debug-synchronization']])('%s <value> should be passed as CLI argument', async (__debug_synchronization) => {
      await run(`${__debug_synchronization} 5000`);
      expect(cliCall().command).toContain('--debug-synchronization 5000')
    });

    test.each([['-d'], ['--debug-synchronization']])('%s <value> should have default value = 3000', async (__debug_synchronization) => {
      await run(`${__debug_synchronization}`);
      expect(cliCall().command).toContain('--debug-synchronization 3000')
    });

    test.each([['-a'], ['--artifacts-location']])('%s <value> should be passed as CLI argument', async (__artifacts_location) => {
      await run(`${__artifacts_location} someLocation`);
      expect(cliCall().command).toContain('--artifacts-location someLocation')
    });

    test('--record-logs <value> should be passed as CLI argument', async () => {
      await run(`--record-logs all`);
      expect(cliCall().command).toContain('--record-logs all')
    });

    test('--take-screenshots <value> should be passed as CLI argument', async () => {
      await run(`--take-screenshots failing`);
      expect(cliCall().command).toContain('--take-screenshots failing')
    });

    test('--record-videos <value> should be passed as CLI argument', async () => {
      await run(`--record-videos failing`);
      expect(cliCall().command).toContain('--record-videos failing')
    });

    test('--record-performance <value> should be passed as CLI argument', async () => {
      await run(`--record-performance all`);
      expect(cliCall().command).toContain('--record-performance all')
    });

    test('--record-timeline <value> should print "unsupported" warning', async () => {
      await run(`--record-timeline all`);
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Cannot use --record-timeline.'));
    });

    test.each([['-w'], ['--workers']])('%s <value> should print "unsupported" warning', async (__workers) => {
      await run(`${__workers} 2`);
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Cannot use -w, --workers.'));
    });

    test.each([['-H'], ['--headless']])('%s <value> should be passed as CLI argument', async (__headless) => {
      await run(`${__headless}`);
      expect(cliCall().command).toContain('--headless');
    });

    test('--gpu <value> should be passed as CLI argument', async () => {
      await run(`--gpu angle_indirect`);
      expect(cliCall().command).toContain('--gpu angle_indirect');
    });

    test('--device-launch-args should be passed as an environment variable', async () => {
      await run(`--device-launch-args "--verbose"`);
      expect(cliCall().env).toEqual({
        deviceLaunchArgs: '--verbose',
      });
    });

    test('--app-launch-args should be passed as an environment variable', async () => {
      await run(`--app-launch-args "--debug yes"`);
      expect(cliCall().env).toEqual({
        appLaunchArgs: '--debug yes',
      });
    });

    test('--use-custom-logger false should be prevent passing CLI argument', async () => {
      await run(`--use-custom-logger false`);
      expect(cliCall().command).not.toContain('--use-custom-logger');
    });

    test('--force-adb-install should be ignored for iOS', async () => {
      singleConfig().type = 'ios.simulator';
      await run(`--force-adb-install`);

      expect(cliCall().command).not.toContain('--force-adb-install');
    });

    test('--force-adb-install should be passed as CLI argument for Android', async () => {
      singleConfig().type = 'android.emulator';
      await run(`--force-adb-install`);

      expect(cliCall().command).toContain('--force-adb-install');
    });

    test.each([['-n'], ['--device-name']])('%s <value> should be passed as CLI argument', async (__device_name) => {
      await run(`${__device_name} TheDevice`);
      expect(cliCall().command).toContain('--device-name TheDevice');
    });

    test('should omit --grep --invert for custom platforms', async () => {
      const customDriver = `module.exports = class CustomDriver {};`
      singleConfig().type = tempfile('.js', customDriver);

      await run();
      expect(cliCall().command).not.toContain(' --invert ');
      expect(cliCall().command).not.toContain(' --grep ');
    });

    test('specifying direct test paths', async () => {
      await run(`e2e/01.sanity.test.js e2e/02.sanity.test.js`);
      expect(cliCall().command).not.toMatch(/ e2e /);
      expect(cliCall().command).not.toMatch(/ e2e$/);
      expect(cliCall().command).toMatch(/ e2e\/01.sanity.test.js e2e\/02.sanity.test.js$/);
    });

    test('e.g., --bail should be passed through', async () => {
      await run(`--bail`);
      expect(cliCall().command).toContain('--bail');
    });

    test('e.g., --reporter spec should be passed through', async () => {
      await run(`--reporter spec`);
      expect(cliCall().command).toContain('--reporter spec');
    });

    test('e.g., --bail e2e/Login.test.js should be split to --bail and e2e/Login.test.js', async () => {
      await run(`--bail e2e/Login.test.js --reporter spec`);
      expect(cliCall().command).toContain('--bail --reporter spec e2e/Login.test.js');
    });

    test.each([
      [`--runner-config "mocha configs/.mocharc"`, `--config ${quote('mocha configs/.mocharc')}`],
      [`--artifacts-location "artifacts dir/"`, `--artifacts-location ${quote('artifacts dir/')}`],
      [`--device-name "iPhone X"`, `--device-name ${quote('iPhone X')}`],
      [`"e2e tests/first test.spec.js"`, `"e2e tests/first test.spec.js"`],
    ])('should escape %s when forwarding it as a CLI argument', async (cmd, expected) => {
      await run(cmd);
      expect(cliCall().command).toContain(` ${expected}`);
    });
  });

  describe('(jest)', () => {
    beforeEach(() => {
      detoxConfig.testRunner = 'jest';
    });

    describe('given no extra args (iOS)', () => {
      beforeEach(async () => {
        singleConfig().type = 'ios.simulator';
        await run();
      });

      test('should produce a default command (integration test, ios)', () => {
        const args = `--config e2e/config.json --testNamePattern ${quote('^((?!:android:).)*$')} --maxWorkers 1`;
        expect(cliCall().command).toBe(`jest ${args} e2e`);
      });

      test('should put default environment variables (integration test, ios)', () => {
        expect(cliCall().env).toEqual({
          DETOX_START_TIMESTAMP: expect.any(Number),
          configPath: expect.any(String),
          reportSpecs: true,
          useCustomLogger: true,
        });
      });
    });

    describe('given no extra args (Android)', () => {
      beforeEach(async () => {
        singleConfig().type = 'android.emulator';
        await run();
      });

      test('should produce a default command (integration test)', () => {
        const args = `--config e2e/config.json --testNamePattern ${quote('^((?!:ios:).)*$')} --maxWorkers 1`;
        expect(cliCall().command).toBe(`jest ${args} e2e`);
      });

      test('should put default environment variables (integration test)', () => {
        expect(cliCall().env).toEqual({
          DETOX_START_TIMESTAMP: expect.any(Number),
          configPath: expect.any(String),
          reportSpecs: true,
          useCustomLogger: true,
          forceAdbInstall: false,
          readOnlyEmu: false,
        });
      });
    });

    test.each([['-c'], ['--configuration']])(
      '%s <configuration> should provide inverted --testNamePattern that configuration (jest)',
      async (__configuration) => {
        detoxConfig.configurations.iosTest = { ...detoxConfig.configurations.single };
        detoxConfig.configurations.iosTest.type = 'ios.simulator';
        detoxConfig.configurations.androidTest = { ...detoxConfig.configurations.single };
        detoxConfig.configurations.androidTest.type = 'android.emulator';

        await run(`${__configuration} androidTest`);
        expect(cliCall(0).command).toContain(`--testNamePattern ${quote('^((?!:ios:).)*$')}`);
        expect(cliCall(0).env.configuration).toBe('androidTest');

        await run(`${__configuration} iosTest`);
        expect(cliCall(1).command).toContain(`--testNamePattern ${quote('^((?!:android:).)*$')}`);
        expect(cliCall(1).env.configuration).toBe('iosTest');
      }
    );

    test.each([['-o'], ['--runner-config']])('%s <path> should point to the specified Jest config', async (__runnerConfig) => {
      await run(`${__runnerConfig} e2e/custom.config.js`);
      expect(cliCall().command).toContain(`--config e2e/custom.config.js`);
    });

    test.each([['-l'], ['--loglevel']])('%s <value> should be passed as environment variable', async (__loglevel) => {
      await run(`${__loglevel} trace`);
      expect(cliCall().env).toEqual(expect.objectContaining({ loglevel: 'trace' }));
    });

    test('--no-color should be passed as CLI argument', async () => {
      await run(`--no-color`);
      expect(cliCall().command).toContain(' --no-color ');
    });

    test.each([['-R'], ['--retries']])('%s <value> should execute successful run once', async (__retries) => {
      await run(`-R 1`);
      expect(cliCall(1)).toBe(null);
    });

    test.each([['-R'], ['--retries']])('%s <value> should clear failed tests file', async (__retries) => {
      await run(`-R 1`);
      const { resetLastFailedTests } = require('../src/utils/lastFailedTests');
      expect(resetLastFailedTests).toHaveBeenCalled();
    });

    test.each([['-R'], ['--retries']])('%s <value> should execute unsuccessful run N extra times', async (__retries) => {
      const { loadLastFailedTests } = require('../src/utils/lastFailedTests');
      loadLastFailedTests.mockReturnValueOnce(['e2e/failing1.test.js', 'e2e/failing2.test.js']);
      loadLastFailedTests.mockReturnValueOnce(['e2e/failing2.test.js']);
      cp.execSync.mockImplementation(() => { throw new Error; });

      await run(`-R 2`).catch(_.noop);
      expect(cliCall(0).command).toMatch(/ e2e$/);
      expect(cliCall(0).env).not.toHaveProperty('DETOX_RERUN_INDEX');

      expect(cliCall(1).command).toMatch(/ e2e\/failing1.test.js e2e\/failing2.test.js$/);
      expect(cliCall(1).env.DETOX_RERUN_INDEX).toBe(1);

      expect(cliCall(2).command).toMatch(/ e2e\/failing2.test.js$/);
      expect(cliCall(2).env.DETOX_RERUN_INDEX).toBe(2);
    });

    test.each([['-R'], ['--retries']])('%s <value> should not restart test runner if there are no failing tests paths', async (__retries) => {
      const { loadLastFailedTests } = require('../src/utils/lastFailedTests');
      loadLastFailedTests.mockReturnValueOnce([]);
      cp.execSync.mockImplementation(() => { throw new Error; });

      await run(`-R 1`).catch(_.noop);
      expect(cliCall(0)).not.toBe(null);
      expect(cliCall(1)).toBe(null);
    });

    test.each([['-R'], ['--retries']])('%s <value> should retain -- <...explicitPassthroughArgs>', async (__retries) => {
      const { loadLastFailedTests } = require('../src/utils/lastFailedTests');
      loadLastFailedTests.mockReturnValue(['tests/failing.test.js']);
      cp.execSync.mockImplementation(() => { throw new Error; });

      await run(`-R 1 tests -- --debug`).catch(_.noop);
      expect(cliCall(0).command).toMatch(/ --debug .* tests$/);
      expect(cliCall(1).command).toMatch(/ --debug .* tests\/failing.test.js$/);
    });

    test.each([['-r'], ['--reuse']])('%s <value> should be passed as environment variable', async (__reuse) => {
      await run(`${__reuse}`);
      expect(cliCall().env).toEqual(expect.objectContaining({ reuse: true }));
    });

    test.each([['-u'], ['--cleanup']])('%s <value> should be passed as environment variable', async (__cleanup) => {
      await run(`${__cleanup}`);
      expect(cliCall().env).toEqual(expect.objectContaining({ cleanup: true }));
    });

    test.each([['-d'], ['--debug-synchronization']])('%s <value> should be passed as environment variable', async (__debug_synchronization) => {
      await run(`${__debug_synchronization} 5000`);
      expect(cliCall().env).toEqual(expect.objectContaining({ debugSynchronization: 5000 }));
    });

    test.each([['-d'], ['--debug-synchronization']])('%s <value> should have default value = 3000', async (__debug_synchronization) => {
      await run(`${__debug_synchronization}`);
      expect(cliCall().env).toEqual(expect.objectContaining({ debugSynchronization: 3000 }));
    });

    test.each([['-a'], ['--artifacts-location']])('%s <value> should be passed as environment variable', async (__artifacts_location) => {
      await run(`${__artifacts_location} /tmp`);
      expect(cliCall().env).toEqual(expect.objectContaining({ artifactsLocation: '/tmp' }));
    });

    test('--record-logs <value> should be passed as environment variable', async () => {
      await run(`--record-logs all`);
      expect(cliCall().env).toEqual(expect.objectContaining({ recordLogs: 'all' }));
    });

    test('--take-screenshots <value> should be passed as environment variable', async () => {
      await run(`--take-screenshots failing`);
      expect(cliCall().env).toEqual(expect.objectContaining({ takeScreenshots: 'failing' }));
    });

    test('--record-videos <value> should be passed as environment variable', async () => {
      await run(`--record-videos failing`);
      expect(cliCall().env).toEqual(expect.objectContaining({ recordVideos: 'failing' }));
    });

    test('--record-performance <value> should be passed as environment variable', async () => {
      await run(`--record-performance all`);
      expect(cliCall().env).toEqual(expect.objectContaining({ recordPerformance: 'all' }));
    });

    test('--record-timeline <value> should be passed as environment variable', async () => {
      await run(`--record-timeline all`);
      expect(cliCall().env).toEqual(expect.objectContaining({ recordTimeline: 'all' }));
    });

    test.each([['-w'], ['--workers']])('%s <value> should be passed as CLI argument', async (__workers) => {
      await run(`${__workers} 2`);
      expect(cliCall().command).toContain('--maxWorkers 2');
    });

    test.each([['-w'], ['--workers']])('%s <value> should be replaced with --maxWorkers <value>', async (__workers) => {
      await run(`${__workers} 2 --maxWorkers 3`);

      const { command } = cliCall();
      expect(command).toContain('--maxWorkers 3');
      expect(command).not.toContain('--maxWorkers 2');
    });

    test.each([['-w'], ['--workers']])('%s <value> can be overriden by a later value', async (__workers) => {
      await run(`${__workers} 2 ${__workers} 3`);

      const { command } = cliCall();
      expect(command).toContain('--maxWorkers 3');
      expect(command).not.toContain('--maxWorkers 2');
    });

    test.each([['-w'], ['--workers']])('%s <value> should not warn anything for iOS', async (__workers) => {
      singleConfig().type = 'ios.simulator';
      await run(`${__workers} 2`);
      expect(logger.warn).not.toHaveBeenCalled();
    });

    test.each([['-w'], ['--workers']])('%s <value> should not put readOnlyEmu environment variable for iOS', async (__workers) => {
      singleConfig().type = 'ios.simulator';
      await run(`${__workers} 2`);
      expect(cliCall().env).not.toHaveProperty('readOnlyEmu');
    });

    test.each([['-w'], ['--workers']])('%s <value> should put readOnlyEmu environment variable for Android if there is a single worker', async (__workers) => {
      singleConfig().type = 'android.emulator';
      await run(`${__workers} 1`);
      expect(cliCall().env).toEqual(expect.objectContaining({ readOnlyEmu: false }));
    });

    test.each([['-w'], ['--workers']])('%s <value> should put readOnlyEmu environment variable for Android if there are multiple workers', async (__workers) => {
      singleConfig().type = 'android.emulator';
      await run(`${__workers} 2`);
      expect(cliCall().env).toEqual(expect.objectContaining({ readOnlyEmu: true }));
    });

    test('should omit --testNamePattern for custom platforms', async () => {
      const customDriver = `module.exports = class CustomDriver {};`
      singleConfig().type = tempfile('.js', customDriver);

      await run();
      expect(cliCall().command).not.toContain('--testNamePattern');
    });

    test.each([['-t'], ['--testNamePattern']])('should override --testNamePattern if a custom %s value is passed', async (__testNamePattern) => {
      await run(`${__testNamePattern} customPattern`);
      const { command } = cliCall();

      expect(command).not.toMatch(/--testNamePattern .*(ios|android)/);
      expect(command).toMatch(/--testNamePattern customPattern($| )/);
    });

    test('--jest-report-specs, by default, should be true, as environment variable', async () => {
      await run();
      expect(cliCall().env).toEqual(expect.objectContaining({ reportSpecs: true }));
    });

    test('--jest-report-specs, by default, should be false, if multiple workers are enabled', async () => {
      await run('--workers 2');
      expect(cliCall().env).toEqual(expect.objectContaining({ reportSpecs: false }));
    });

    test('--jest-report-specs, set explicitly, should override single worker defaults', async () => {
      await run('--jest-report-specs false');
      expect(cliCall().env).toEqual(expect.objectContaining({ reportSpecs: false }));
    });

    test('--jest-report-specs, set explicitly, should override multiple workers defaults', async () => {
      await run('--workers 2 --jest-report-specs');
      expect(cliCall().env).toEqual(expect.objectContaining({ reportSpecs: true }));
    });

    test.each([['-H'], ['--headless']])('%s <value> should be passed as environment variable', async (__headless) => {
      await run(`${__headless}`);
      expect(cliCall().env).toEqual(expect.objectContaining({ headless: true }));
    });

    test('--gpu <value> should be passed as environment variable', async () => {
      await run(`--gpu angle_indirect`);
      expect(cliCall().env).toEqual(expect.objectContaining({ gpu: 'angle_indirect' }));
    });

    test('--device-launch-args should be passed as environment variable', async () => {
      await run(`--device-launch-args "--verbose"`);
      expect(cliCall().env).toEqual(expect.objectContaining({
        deviceLaunchArgs: '--verbose'
      }));
    });

    test('--app-launch-args should be passed as an environment variable', async () => {
      await run(`--app-launch-args "--debug yes"`);
      expect(cliCall().env).toEqual(expect.objectContaining({
        appLaunchArgs: '--debug yes',
      }));
    });

    test('--use-custom-logger false should be prevent passing environment variable', async () => {
      await run(`--use-custom-logger false`);
      expect(cliCall().env).toEqual(expect.objectContaining({
        useCustomLogger: false
      }));
    });

    test('--force-adb-install should be ignored for iOS', async () => {
      singleConfig().type = 'ios.simulator';
      await run(`--force-adb-install`);
      expect(cliCall().env).not.toHaveProperty('forceAdbInstall');
    });

    test('--force-adb-install should be passed as environment variable', async () => {
      singleConfig().type = 'android.emulator';
      await run(`--force-adb-install`);
      expect(cliCall().env).toEqual(expect.objectContaining({
        forceAdbInstall: true,
      }));
    });

    test.each([['-n'], ['--device-name']])('%s <value> should be passed as environment variable', async (__device_name) => {
      await run(`${__device_name} TheDevice`);
      expect(cliCall().env).toEqual(expect.objectContaining({
        deviceName: 'TheDevice',
      }));
    });

    test('specifying direct test paths', async () => {
      await run(`e2e/01.sanity.test.js e2e/02.sanity.test.js`);
      expect(cliCall().command).not.toMatch(/ e2e /);
      expect(cliCall().command).not.toMatch(/ e2e$/);
      expect(cliCall().command).toMatch(/ e2e\/01.sanity.test.js e2e\/02.sanity.test.js$/);
    });

    test.each([
      ['--inspect-brk e2eFolder', /^node --inspect-brk jest .* e2eFolder$/, {}],
      ['-d e2eFolder', / e2eFolder$/, { debugSynchronization: 3000 }],
      ['--debug-synchronization e2eFolder', / e2eFolder$/, { debugSynchronization: 3000 }],
      ['-r e2eFolder', / e2eFolder$/, { reuse: true }],
      ['--reuse e2eFolder', / e2eFolder$/, { reuse: true }],
      ['-u e2eFolder', / e2eFolder$/, { cleanup: true }],
      ['--cleanup e2eFolder', / e2eFolder$/, { cleanup: true }],
      ['--jest-report-specs e2eFolder', / e2eFolder$/, { reportSpecs: true }],
      ['-H e2eFolder', / e2eFolder$/, { headless: true }],
      ['--headless e2eFolder', / e2eFolder$/, { headless: true }],
      ['--keepLockFile e2eFolder', / e2eFolder$/, {}],
      ['--use-custom-logger e2eFolder', / e2eFolder$/, { useCustomLogger: true }],
      ['--force-adb-install e2eFolder', / e2eFolder$/, { forceAdbInstall: true }],
    ])('"%s" should be disambigued correctly', async (command, commandMatcher, envMatcher) => {
      singleConfig().type = 'android.emulator';
      await run(command);

      expect(cliCall().command).toMatch(commandMatcher);
      expect(cliCall().env).toEqual(expect.objectContaining(envMatcher));
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
      [`--testNamePattern "should tap"`, `--testNamePattern ${quote('should tap')}`],
      [`"e2e tests/first test.spec.js"`, `"e2e tests/first test.spec.js"`],
    ])('should escape %s when forwarding it as a CLI argument', async (cmd, expected) => {
      await run(cmd);
      expect(cliCall().command).toContain(` ${expected}`);
    });
  });

  describe.each([['mocha'], ['jest']])('(%s)', (testRunner) => {
    beforeEach(() => {
      detoxConfig.testRunner = testRunner;
    });

    test(`should deduce wrapped ${testRunner} CLI`, async () => {
      detoxConfig.testRunner = `nyc ${testRunner}`;
      await run();
      expect(cliCall().command).toMatch(RegExp(`nyc ${testRunner} .* e2e$`));
    });

    describe.each([['ios.simulator'], ['android.emulator']])('for %s', (deviceType) => {
      beforeEach(() => {
        Object.values(detoxConfig.configurations)[0].type = deviceType;
      });

      test('--keepLockFile should be suppress clearing the device lock file', async () => {
        await run('--keepLockFile');
        expect(DeviceRegistry).not.toHaveBeenCalled();
      });

      test('--keepLockFile omission means clearing the device lock file', async () => {
        await run();
        expect(DeviceRegistry.mock.instances[0].reset).toHaveBeenCalled();
      });
    });

    test('-- <...explicitPassthroughArgs> should be forwarded to the test runner CLI as-is', async () => {
      await run('--device-launch-args detoxArgs e2eFolder -- a -a --a --device-launch-args runnerArgs');
      expect(cliCall().command).toMatch(/a -a --a --device-launch-args runnerArgs .* e2eFolder$/);
      expect(cliCall().env).toEqual(expect.objectContaining({ deviceLaunchArgs: 'detoxArgs' }));
    });

    test('-- <...explicitPassthroughArgs> should omit double-dash "--" itself, when forwarding args', async () => {
      await run('./detox -- --forceExit');

      expect(cliCall().command).toMatch(/ --forceExit .* \.\/detox$/);
      expect(cliCall().command).not.toMatch(/ -- --forceExit .* \.\/detox$/);
    });

    test('--inspect-brk should prepend "node --inspect-brk" to the command', async () => {
      await run('--inspect-brk');
      expect(cliCall().command).toMatch(RegExp(`^node --inspect-brk ${testRunner}`));
    });

    test('should append $DETOX_ARGV_OVERRIDE to detox test ... command and print a warning', async () => {
      process.env.PLATFORM = 'ios';
      process.env.DETOX_ARGV_OVERRIDE = '--inspect-brk --testNamePattern "[$PLATFORM] tap" e2e/sanity/*.test.js';
      await run();

      const pattern = new RegExp(`^node --inspect-brk.* --testNamePattern ${quote('\\[ios\\] tap')}.* e2e/sanity/\\*\\.test.js$`);

      expect(cliCall().command).toMatch(pattern);
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('$DETOX_ARGV_OVERRIDE is detected'));
    });
  });

  test('should fail for unrecognized test runner', async () => {
    detoxConfig.testRunner = 'ava';
    await expect(run('--inspect-brk')).rejects.toThrowError(/ava.*is not supported/);
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

    return {
      command,
      env: _.omitBy(opts.env, (_value, key) => key in process.env),
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
