jest.mock('../utils/argparse');

describe('collectCliConfig', () => {
  let collectCliConfig;
  let argv, env;

  beforeEach(() => {
    argv = {};
    env = {};

    require('../utils/argparse').getArgValue
      .mockImplementation(key => env[key]);

    collectCliConfig = require('./collectCliConfig');
  });

  describe.each([
    ['artifactsLocation', 'artifacts-location'],
    ['recordLogs', 'record-logs'],
    ['takeScreenshots', 'take-screenshots'],
    ['recordVideos', 'record-videos'],
    ['recordPerformance', 'record-performance'],
    ['recordTimeline', 'record-timeline'],
    ['cleanup', 'cleanup'],
    ['configPath', 'config-path'],
    ['configuration', 'configuration'],
    ['debugSynchronization', 'debug-synchronization'],
    ['deviceLaunchArgs', 'device-launch-args'],
    ['appLaunchArgs', 'DETOX_APP_LAUNCH_ARGS'],
    ['deviceName', 'device-name'],
    ['forceAdbInstall', 'force-adb-install'],
    ['gpu', 'gpu'],
    ['headless', 'headless'],
    ['jestReportSpecs', 'jest-report-specs'],
    ['keepLockFile', 'keepLockFile'],
    ['loglevel', 'loglevel'],
    ['noColor', 'no-color'],
    ['reuse', 'reuse'],
    ['runnerConfig', 'runner-config'],
    ['useCustomLogger', 'use-custom-logger'],
    ['workers', 'workers'],
    ['inspectBrk', 'inspect-brk'],
  ])('.%s property', (key, argName) => {
    beforeEach(() => {
      argv[argName] = Math.random();
      env[argName] = Math.random();
    });

    it('should be extracted from argv', () => {
      argv[argName] = Math.random();
      expect(collectCliConfig({ argv })[key]).toBe(argv[argName]);
    });

    it('should be extracted from environment (via argparse)', () => {
      argv = undefined;
      env[argName] = Math.random();

      expect(collectCliConfig({ argv })[key]).toBe(env[argName]);
    });

    it('should be extracted from argv, even if argparse has it too', () => {
      argv[argName] = Math.random();
      env[argName] = Math.random();
      expect(collectCliConfig({ argv })[key]).toBe(argv[argName]);
    });
  });
});
