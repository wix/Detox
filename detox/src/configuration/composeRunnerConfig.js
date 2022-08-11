const os = require('os');

const _ = require('lodash');

/**
 * @param {object} opts
 * @param {Detox.DetoxConfig} opts.globalConfig
 * @param {Detox.DetoxConfiguration} opts.localConfig
 * @param {DetoxInternals.DetoxCLIConfig} opts.cliConfig
 * @param {Record<string, any>} opts.testRunnerArgv
 * @param {import('../errors/DetoxConfigErrorComposer')} opts.errorComposer
 * @returns {Detox.DetoxTestRunnerConfig} opts.testRunnerArgv
 */
function composeRunnerConfig(opts) {
  const globalConfig = opts.globalConfig.testRunner;
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
      jest: {
        initTimeout: 300000,
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
      merged.inspectBrk(merged);
      merged.inspectBrk = true;
    } else {
      merged.inspectBrk = false;
    }
  }

  return merged;
}

function hasEmptyPositionalArgs(value, key) {
  return key === '_' ? _.isEmpty(value) : false;
}

/**
 * @param {Detox.DetoxTestRunnerConfig} config
 */
function inspectBrkHookDefault(config) {
  config.args.$0 = /* istanbul ignore if */ os.platform() === 'win32'
    ? `node --inspect-brk ./node_modules/jest/bin/jest.js`
    : `node --inspect-brk ./node_modules/.bin/jest`;
  config.args.runInBand = true;
  delete config.args.w;
  delete config.args.workers;
}

module.exports = composeRunnerConfig;
