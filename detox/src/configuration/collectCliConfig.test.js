describe('collectCliConfig', () => {
  let collectCliConfig;
  let argv, env;
  let __env__;

  beforeEach(() => {
    __env__ = process.env;
    env = process.env = { ...__env__ };
    argv = {};

    collectCliConfig = require('./collectCliConfig');
  });

  afterEach(() => {
    process.env = __env__;
  });

  describe.each([
    ['artifactsLocation',    'DETOX_ARTIFACTS_LOCATION',    'artifacts-location'],
    ['captureViewHierarchy', 'DETOX_CAPTURE_VIEW_HIERARCHY','capture-view-hierarchy'],
    ['recordLogs',           'DETOX_RECORD_LOGS',           'record-logs'],
    ['takeScreenshots',      'DETOX_TAKE_SCREENSHOTS',      'take-screenshots'],
    ['recordVideos',         'DETOX_RECORD_VIDEOS',         'record-videos'],
    ['recordPerformance',    'DETOX_RECORD_PERFORMANCE',    'record-performance'],
    ['recordTimeline',       'DETOX_RECORD_TIMELINE',       'record-timeline'],
    ['cleanup',              'DETOX_CLEANUP',               'cleanup'],
    ['configPath',           'DETOX_CONFIG_PATH',           'config-path'],
    ['configuration',        'DETOX_CONFIGURATION',         'configuration'],
    ['debugSynchronization', 'DETOX_DEBUG_SYNCHRONIZATION', 'debug-synchronization'],
    ['deviceLaunchArgs',     'DETOX_DEVICE_LAUNCH_ARGS',    'device-launch-args'],
    ['appLaunchArgs',        'DETOX_APP_LAUNCH_ARGS',       'app-launch-args'],
    ['deviceName',           'DETOX_DEVICE_NAME',           'device-name'],
    ['forceAdbInstall',      'DETOX_FORCE_ADB_INSTALL',     'force-adb-install'],
    ['gpu',                  'DETOX_GPU',                   'gpu'],
    ['headless',             'DETOX_HEADLESS',              'headless'],
    ['jestReportSpecs',      'DETOX_JEST_REPORT_SPECS',     'jest-report-specs'],
    ['keepLockFile',         'DETOX_KEEP_LOCK_FILE',        'keepLockFile'],
    ['loglevel',             'DETOX_LOGLEVEL',              'loglevel'],
    ['noColor',              'DETOX_NO_COLOR',              'no-color'],
    ['reuse',                'DETOX_REUSE',                 'reuse'],
    ['runnerConfig',         'DETOX_RUNNER_CONFIG',         'runner-config'],
    ['useCustomLogger',      'DETOX_USE_CUSTOM_LOGGER',     'use-custom-logger'],
    ['workers',              'DETOX_WORKERS',               'workers'],
    ['inspectBrk',           'DETOX_INSPECT_BRK',           'inspect-brk'],
  ])('.%s property' , (key, envName, argName) => {
    beforeEach(() => {
      env[envName] = Math.random();
      argv[argName] = Math.random();
    });

    it('should be extracted from argv if it is provided', () => {
      const expected = argv[argName];
      expect(collectCliConfig({ argv })[key]).toBe(expected);
    });

    it('should be extracted from environment in DETOX_SNAKE_CASE otherwise', () => {
      const expected = env[envName];

      expect(collectCliConfig({})[key]).toBe(expected);
    });
  });
});
