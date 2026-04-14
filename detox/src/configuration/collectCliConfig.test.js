const inspect = require('util').inspect;

jest.mock('../utils/logger');

const J = x => inspect(x);

describe('collectCliConfig', () => {
  let collectCliConfig;
  let argv, env;
  let logger;
  let __env__;
  let errorComposer;
  let DetoxConfigErrorComposer;

  beforeEach(() => {
    __env__ = process.env;
    env = process.env = { ...__env__ };
    argv = {};

    DetoxConfigErrorComposer = require('../errors').DetoxConfigErrorComposer;
    errorComposer = new DetoxConfigErrorComposer();
    collectCliConfig = () => require('./collectCliConfig')({ argv, errorComposer });
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

  function asBooleanEnum(testCase, enumValues) {
    return multiplyTest(testCase, [
      [undefined, undefined],
      [null, undefined],
      ['', undefined],
      ['true', true],
      ['false', false],
      ...(enumValues || []).map((value) => [value, value]),
    ]);
  }

  describe('mutual exclusivity', () => {
    it('should throw error if both --inspect-brk and --repl are set', () => {
      argv['inspect-brk'] = true;
      argv['repl'] = true;

      const mutuallyExclusiveError = errorComposer.mutuallyExclusiveCliOptions('--inspect-brk', '--repl');
      expect(collectCliConfig).toThrow(mutuallyExclusiveError);
    });

    it('should not throw if only --inspect-brk is set', () => {
      argv['inspect-brk'] = true;

      expect(collectCliConfig).not.toThrow();
    });

    it('should not throw if only --repl is set', () => {
      argv['repl'] = true;

      expect(collectCliConfig).not.toThrow();
    });

    it('should not throw if neither --inspect-brk nor --repl is set', () => {
      expect(collectCliConfig).not.toThrow();
    });
  });

  describe.each([
    ...asString( ['artifactsLocation',    'DETOX_ARTIFACTS_LOCATION',     'artifacts-location']),
    ...asString( ['captureViewHierarchy', 'DETOX_CAPTURE_VIEW_HIERARCHY', 'capture-view-hierarchy']),
    ...asString( ['recordLogs',           'DETOX_RECORD_LOGS',            'record-logs']),
    ...asString( ['takeScreenshots',      'DETOX_TAKE_SCREENSHOTS',       'take-screenshots']),
    ...asString( ['recordVideos',         'DETOX_RECORD_VIDEOS',          'record-videos']),
    ...asString( ['recordPerformance',    'DETOX_RECORD_PERFORMANCE',     'record-performance']),
    ...asBoolean(['cleanup',              'DETOX_CLEANUP',                'cleanup']),
    ...asString( ['configPath',            'DETOX_CONFIG_PATH',            'config-path']),
    ...asString( ['configuration' ,        'DETOX_CONFIGURATION',          'configuration']),
    ...asNumber( ['debugSynchronization', 'DETOX_DEBUG_SYNCHRONIZATION',  'debug-synchronization']),
    ...asString( ['deviceBootArgs',       'DETOX_DEVICE_BOOT_ARGS',       'device-boot-args']),
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
    ...asNumber( ['retries',              'DETOX_RETRIES',                'retries']),
    ...asBoolean(['readonlyEmu',          'DETOX_READ_ONLY_EMU',          null]),
    ...asBoolean(['useCustomLogger',      'DETOX_USE_CUSTOM_LOGGER',      'use-custom-logger']),
    ...asBoolean(['inspectBrk',           'DETOX_INSPECT_BRK',            'inspect-brk']),
    ...asString( ['start',                'DETOX_START',                  'start']),
    ...asBoolean(['ignoreUnexpectedWsMessages', 'DETOX_IGNORE_UNEXPECTED_WS_MESSAGES', 'ignore-unexpected-ws-messages']),
    ...asBooleanEnum(['repl',             'DETOX_REPL',                   'repl'], ['auto']),
  ])('.%s property' , (key, envName, argName, input, expected) => {
    beforeEach(() => {
      if (envName) env[envName] = input;
      if (argName) argv[argName] = input;
    });

    describe('when provided inside argv', () => {
      if (!argName) return;

      it(`should be extracted from there (${J(input)} -> ${J(expected)})`, () => {
        expect(collectCliConfig()[key]).toBe(expected);
      });
    });

    describe('when not provided inside argv', () => {
      if (!envName) return;

      it(`should be extracted from $DETOX_SNAKE_CASE-named var (${J(input)} -> ${J(expected)})`, () => {
        expect(collectCliConfig()[key]).toBe(expected);
      });
    });

    describe('as a regular CLI override', () => {
      it(`should not print a warning`, () =>
        expect(logger.warn).not.toHaveBeenCalled());
    });
  });
});
