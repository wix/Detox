const _ = require('lodash');
const argparse = require('../utils/argparse');

function collectCliConfig({ argv }) {
  const env = (key) => argparse.getArgValue(key);
  const get = (key) => argv ? argv[key] : env(key);

  return _.omitBy({
    artifactsLocation: get('artifacts-location'),
    recordLogs: get('record-logs'),
    takeScreenshots: get('take-screenshots'),
    recordVideos: get('record-videos'),
    recordPerformance: get('record-performance'),
    recordTimeline: get('record-timeline'),
    cleanup: get('cleanup'),
    configPath: get('config-path'),
    configuration: get('configuration'),
    debugSynchronization: get('debug-synchronization'),
    deviceLaunchArgs: get('device-launch-args'),
    deviceName: get('device-name'),
    forceAdbInstall: get('force-adb-install'),
    gpu: get('gpu'),
    headless: get('headless'),
    jestReportSpecs: get('jest-report-specs'),
    keepLockFile: get('keepLockFile'),
    loglevel: get('loglevel'),
    noColor: get('no-color'),
    reuse: get('reuse'),
    runnerConfig: get('runner-config'),
    useCustomLogger: get('use-custom-logger'),
    workers: get('workers'),
  }, _.isUndefined);
}

module.exports = collectCliConfig;
