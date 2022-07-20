const inspect = require('util').inspect;

const { DEVICE_LAUNCH_ARGS_GENERIC_DEPRECATION } = require('./utils/warnings');

jest.mock('../utils/logger');

const J = x => inspect(x);

describe('collectCliConfig', () => {
  let collectCliConfig;
  let argv, env;
  let logger;
  let __env__;

  beforeEach(() => {
    __env__ = process.env;
    env = process.env = { ...__env__ };
    argv = {};

    collectCliConfig = require('./collectCliConfig');
    logger = require('../utils/logger');
  });

  afterEach(() => {
    process.env = __env__;
  });

  function multiplyTest(testCase, pairs) {
    return pairs.map(([input, expected]) => [...testCase, input, expected]);
  }

  function asString(testCase) {
    return multiplyTest(testCase, [
      [undefined, undefined],
      ['', ''],
      ['some', 'some'],
    ]);
  }

  function asNumber(testCase) {
    return multiplyTest(testCase, [
      [undefined, undefined],
      [null, undefined],
      ['', undefined],
      ['some', NaN],
      ['0', 0],
      ['1', 1],
      ['3000', 3000],
      [-10.3, -10.3],
    ]);
  }

  function asBoolean(testCase) {
    return multiplyTest(testCase, [
      [undefined, undefined],
      [null, undefined],
      ['', false],
      ['false', false],
      ['0', false],
      ['1', true],
      ['true', true],
      ['anything', true],
      [false, false],
      [true, true],
    ]);
  }

  describe.each([
    ...asString( ['artifactsLocation',    'DETOX_ARTIFACTS_LOCATION',     'artifacts-location']),
    ...asString( ['captureViewHierarchy', 'DETOX_CAPTURE_VIEW_HIERARCHY', 'capture-view-hierarchy']),
    ...asString( ['recordLogs',           'DETOX_RECORD_LOGS',            'record-logs']),
    ...asString( ['takeScreenshots',      'DETOX_TAKE_SCREENSHOTS',       'take-screenshots']),
    ...asString( ['recordVideos',         'DETOX_RECORD_VIDEOS',          'record-videos']),
    ...asString( ['recordPerformance',    'DETOX_RECORD_PERFORMANCE',     'record-performance']),
    ...asString( ['recordTimeline',       'DETOX_RECORD_TIMELINE',        'record-timeline']),
    ...asBoolean(['cleanup',              'DETOX_CLEANUP',                'cleanup']),
    ...asString( ['configPath',            'DETOX_CONFIG_PATH',            'config-path']),
    ...asString( ['configuration' ,        'DETOX_CONFIGURATION',          'configuration']),
    ...asNumber( ['debugSynchronization', 'DETOX_DEBUG_SYNCHRONIZATION',  'debug-synchronization']),
    ...asString( ['deviceBootArgs',       'DETOX_DEVICE_BOOT_ARGS',       'device-boot-args']),
    ...asString( ['deviceBootArgs',       'DETOX_DEVICE_LAUNCH_ARGS',     'device-launch-args']),
    ...asString( ['appLaunchArgs',        'DETOX_APP_LAUNCH_ARGS',        'app-launch-args']),
    ...asString( ['deviceName',           'DETOX_DEVICE_NAME',            'device-name']),
    ...asBoolean(['forceAdbInstall',      'DETOX_FORCE_ADB_INSTALL',      'force-adb-install']),
    ...asString( ['gpu',                  'DETOX_GPU',                    'gpu']),
    ...asBoolean(['headless',             'DETOX_HEADLESS',               'headless']),
    ...asBoolean(['jestReportSpecs',      'DETOX_JEST_REPORT_SPECS',      'jest-report-specs']),
    ...asBoolean(['keepLockFile',         'DETOX_KEEP_LOCK_FILE',         'keepLockFile']),
    ...asString( ['loglevel',             'DETOX_LOGLEVEL',               'loglevel']),
    ...asBoolean(['noColor',              'DETOX_NO_COLOR',               'no-color']),
    ...asBoolean(['reuse',                'DETOX_REUSE',                  'reuse']),
    ...asBoolean(['readonlyEmu',          'DETOX_READ_ONLY_EMU',          null]),
    ...asString( ['runnerConfig',          'DETOX_RUNNER_CONFIG',          'runner-config']),
    ...asBoolean(['useCustomLogger',      'DETOX_USE_CUSTOM_LOGGER',      'use-custom-logger']),
    ...asNumber( ['workers',              'DETOX_WORKERS',                'workers']),
    ...asBoolean(['inspectBrk',           'DETOX_INSPECT_BRK',            'inspect-brk']),
  ])('.%s property' , (key, envName, argName, input, expected) => {
    beforeEach(() => {
      if (envName) env[envName] = input;
      if (argName) argv[argName] = input;
    });

    describe('when provided inside argv', () => {
      if (!argName) return;

      it(`should be extracted from there (${J(input)} -> ${J(expected)})`, () => {
        expect(collectCliConfig({ argv })[key]).toBe(expected);
      });
    });

    describe('when not provided inside argv', () => {
      if (!envName) return;

      it(`should be extracted from $DETOX_SNAKE_CASE-named var (${J(input)} -> ${J(expected)})`, () => {
        expect(collectCliConfig({})[key]).toBe(expected);
      });
    });

    describe('as a regular CLI override', () => {
      if (key === 'deviceLaunchArgs') return;

      it(`should not print a warning`, () =>
        expect(logger.warn).not.toHaveBeenCalled());
    });

    describe('as a deprecated CLI override', () => {
      if (key !== 'deviceLaunchArgs') return;

      it(`should print a warning`, () =>
        expect(logger.warn).toHaveBeenCalledWith(DEVICE_LAUNCH_ARGS_GENERIC_DEPRECATION));
    });
  });
});
