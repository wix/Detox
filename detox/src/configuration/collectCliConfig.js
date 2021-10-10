const _ = require('lodash');

const argparse = require('../utils/argparse');
const log = require('../utils/logger').child({ __filename });

const { DEVICE_LAUNCH_ARGS_GENERIC_DEPRECATION } = require('./utils/warnings');

const asBoolean = (value) => {
  if (typeof value === 'boolean') {
    return value;
  }

  return value != null
    ? (value !== 'false' && value !== '0' && value !== '')
    : undefined;
};

const asNumber = (value) => {
  if (typeof value === 'number') {
    return value;
  }

  return value != null && value !== ''
    ? Number(value)
    : undefined;
};

const deprecateDeviceLaunchArgs = (value) => {
  if (value) {
    log.warn(DEVICE_LAUNCH_ARGS_GENERIC_DEPRECATION);
  }

  return value;
};

function collectCliConfig({ argv }) {
  const env = (key) => argparse.getArgValue(key);
  const get = (key, fallback) => {
    const value = argv ? argv[key] : env(key);
    return value === undefined ? fallback : value;
  };

  return _.omitBy({
    artifactsLocation: get('artifacts-location'),
    captureViewHierarchy: get('capture-view-hierarchy'),
    recordLogs: get('record-logs'),
    takeScreenshots: get('take-screenshots'),
    recordVideos: get('record-videos'),
    recordPerformance: get('record-performance'),
    recordTimeline: get('record-timeline'),
    cleanup: asBoolean(get('cleanup')),
    configPath: get('config-path'),
    configuration: get('configuration'),
    debugSynchronization: asNumber(get('debug-synchronization')),
    deviceBootArgs: get('device-boot-args', deprecateDeviceLaunchArgs(argparse.getEnvValue('device-launch-args'))),
    appLaunchArgs: get('app-launch-args'),
    deviceName: get('device-name'),
    forceAdbInstall: asBoolean(get('force-adb-install')),
    gpu: get('gpu'),
    headless: asBoolean(get('headless')),
    readonlyEmu: asBoolean(env('readOnlyEmu')),
    jestReportSpecs: asBoolean(get('jest-report-specs')),
    keepLockFile: asBoolean(get('keepLockFile')),
    loglevel: get('loglevel'),
    noColor: asBoolean(get('no-color')),
    reuse: asBoolean(get('reuse')),
    runnerConfig: get('runner-config'),
    useCustomLogger: asBoolean(get('use-custom-logger')),
    workers: asNumber(get('workers')),
    inspectBrk: asBoolean(get('inspect-brk')),
  }, _.isUndefined);
}

module.exports = collectCliConfig;
