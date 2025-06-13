const _ = require('lodash');

const { DetoxConfigErrorComposer } = require('../errors');
const argparse = require('../utils/argparse');

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

const asBooleanEnum = (value) => {
  if (value == null || value === '') {
    return undefined;
  }
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
};

/**
 * @param {object} opts
 * @param {Record<string, any>} [opts.argv]
 * @param {DetoxConfigErrorComposer} [opts.errorComposer]
 */
function collectCliConfig({ argv, errorComposer }) {
  const env = (key) => argparse.getEnvValue(key);
  const get = (key, fallback) => {
    const value = argv && Reflect.has(argv, key) ? argv[key] : env(key);
    return value === undefined ? fallback : value;
  };

  const inspectBrk = asBoolean(get('inspect-brk'));
  const repl = asBooleanEnum(get('repl'));
  if (inspectBrk && repl) {
    throw errorComposer.mutuallyExclusiveCliOptions('--inspect-brk', '--repl');
  }

  return _.omitBy({
    artifactsLocation: get('artifacts-location'),
    captureViewHierarchy: get('capture-view-hierarchy'),
    recordLogs: get('record-logs'),
    takeScreenshots: get('take-screenshots'),
    recordVideos: get('record-videos'),
    recordPerformance: get('record-performance'),
    cleanup: asBoolean(get('cleanup')),
    configPath: get('config-path'),
    configuration: get('configuration'),
    debugSynchronization: asNumber(get('debug-synchronization')),
    deviceBootArgs: get('device-boot-args'),
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
    useCustomLogger: asBoolean(get('use-custom-logger')),
    retries: asNumber(get('retries')),
    start: get('start'),
    repl,
    inspectBrk,
  }, _.isUndefined);
}

module.exports = collectCliConfig;
