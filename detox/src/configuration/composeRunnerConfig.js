const os = require('os');

const _ = require('lodash');

const log = require('../utils/logger');

/**
 * @param {object} opts
 * @param {Detox.DetoxConfig} opts.globalConfig
 * @param {Detox.DetoxConfiguration} opts.localConfig
 * @param {DetoxInternals.CLIConfig} opts.cliConfig
 * @param {Record<string, any>} opts.testRunnerArgv
 * @param {import('../errors/DetoxConfigErrorComposer')} opts.errorComposer
 * @returns {Detox.DetoxTestRunnerConfig} opts.testRunnerArgv
 */
function composeRunnerConfig(opts) {
  const globalConfig = adaptLegacyRunnerConfig(opts.globalConfig);
  if (globalConfig != null && typeof globalConfig !== 'object') {
    throw opts.errorComposer.invalidTestRunnerProperty(true);
  }

  const localConfig = opts.localConfig.testRunner;
  if (localConfig != null && typeof localConfig !== 'object') {
    throw opts.errorComposer.invalidTestRunnerProperty(false);
  }

  const cliConfig = opts.cliConfig;

  /** @type {Detox.DetoxTestRunnerConfig} */
  const merged = _.merge(
    {
      retries: 0,
      inspectBrk: inspectBrkHookDefault,
      forwardEnv: false,
      detached: false,
      bail: false,
      jest: {
        setupTimeout: 300000,
        teardownTimeout: 30000,
        retryAfterCircusRetries: false,
        reportSpecs: undefined,
        reportWorkerAssign: true,
      },
      args: {
        $0: 'jest',
        _: [],
      },
    },
    globalConfig,
    localConfig,
    cliConfig.retries != null ? { retries: cliConfig.retries } : null,
    cliConfig.jestReportSpecs != null ? { jest: { reportSpecs: cliConfig.jestReportSpecs } } : null,
    {
      args: _.omitBy(opts.testRunnerArgv, hasEmptyPositionalArgs)
    }
  );

  if (typeof merged.inspectBrk === 'function') {
    if (cliConfig.inspectBrk) {
      merged.detached = false;
      merged.forwardEnv = true;
      merged.retries = 0;
      merged.inspectBrk(merged);
    }

    delete merged.inspectBrk;
  }

  return merged;
}

function adaptLegacyRunnerConfig(globalConfig) {
  let isLegacy = false;

  const runnerConfigKey = 'runnerConfig' in globalConfig ? 'runnerConfig' : 'runner-config';
  if (_.isString(globalConfig[runnerConfigKey])) {
    isLegacy = true;
    log.warn(`Detected a deprecated "${runnerConfigKey}" property (string).`);
  }

  const testRunnerKey = 'testRunner' in globalConfig ? 'testRunner' : 'test-runner';
  if (_.isString(globalConfig[testRunnerKey])) {
    isLegacy = true;
    log.warn(`Detected a deprecated "${testRunnerKey}" property (string).`);
  }

  if (globalConfig.specs != null) {
    isLegacy = true;
    log.warn(`Detected a deprecated "specs" property.`);
  }

  if (!isLegacy) {
    return globalConfig.testRunner;
  }

  log.warn(`Please migrate your Detox config according to the guide:\nhttps://wix.github.io/Detox/docs/guide/migration\n`);
  const testRunner = globalConfig[testRunnerKey];
  const runnerConfig = globalConfig[runnerConfigKey];
  const specs = globalConfig.specs != null ? String(globalConfig.specs) : undefined;

  const args = {};
  if (_.isString(testRunner)) {
    args.$0 = testRunner;
  }

  if (_.isString(runnerConfig)) {
    args.config = runnerConfig;
  }

  if (specs) {
    args._ = [specs];
  }

  return { args };
}

function hasEmptyPositionalArgs(value, key) {
  return key === '_' ? _.isEmpty(value) : false;
}

/**
 * @param {Detox.DetoxTestRunnerConfig} config
 */
function inspectBrkHookDefault(config) {
  /* istanbul ignore next */
  config.args.$0 = os.platform() !== 'win32'
    ? `node --inspect-brk ./node_modules/.bin/jest`
    : `node --inspect-brk ./node_modules/jest/bin/jest.js`;
  config.args.runInBand = true;
  delete config.args.w;
  delete config.args.workers;
}

module.exports = composeRunnerConfig;
