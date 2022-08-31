const _ = require('lodash');

const { castLevel, defaultOptions } = require('../logger/DetoxLogger');

/**
 * @param {object} opts
 * @param {Detox.DetoxConfig} opts.globalConfig
 * @param {Detox.DetoxConfiguration} opts.localConfig
 * @param {*} opts.cliConfig
 * @returns {Detox.DetoxLoggerConfig}
 */
function composeLoggerConfig(opts) {
  const { globalConfig, localConfig, cliConfig } = opts;

  return _({}).merge(
    {
      level: 'info',
      overrideConsole: 'sandbox',
      options: {
        ...defaultOptions,
        prefixers: {
          ...defaultOptions.prefixers,
        },
      },
    },
    globalConfig.logger,
    localConfig.logger,
    adaptCLI(cliConfig),
  ).tap(reduceVerbosity).value();
}

function adaptCLI(cliConfig) {
  const result = {};

  if (cliConfig.loglevel !== undefined) {
    result.level = castLevel(cliConfig.loglevel);
  }

  if (cliConfig.useCustomLogger !== undefined) {
    result.overrideConsole = cliConfig.useCustomLogger ? 'all' : 'none';
  }

  if (cliConfig.noColor) {
    result.options = { colors: false };
  }

  return result;
}

function reduceVerbosity(config) {
  if (config.level !== 'debug' && config.level !== 'trace') {
    config.options.showPrefixes = false;
  }

  if (config.level !== 'trace') {
    delete config.options.prefixers.id;
    delete config.options.prefixers.ph;
  }
}

module.exports = composeLoggerConfig;
