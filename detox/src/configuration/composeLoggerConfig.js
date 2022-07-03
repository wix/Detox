const _ = require('lodash');

const { defaultOptions } = require('../logger/DetoxLogger');

/**
 * @param {object} opts
 * @param {Detox.DetoxConfig} opts.globalConfig
 * @param {Detox.DetoxConfiguration} opts.localConfig
 * @param {*} opts.cliConfig
 * @returns {Detox.DetoxLoggerConfig}
 */
function composeLoggerConfig(opts) {
  const { globalConfig, localConfig, cliConfig } = opts;

  return _.merge(
    {
      level: 'info',
      overrideConsole: true,
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
  );
}

function adaptCLI(cliConfig) {
  const result = {};

  if (cliConfig.loglevel !== undefined) {
    if (cliConfig.loglevel === 'verbose') {
      result.level = 'debug';
    } else {
      result.level = cliConfig.loglevel;
    }
  }

  if (cliConfig.useCustomLogger !== undefined) {
    result.overrideConsole = cliConfig.useCustomLogger;
  }

  if (cliConfig.noColor) {
    result.options = { colors: false };
  }

  return result;
}

module.exports = composeLoggerConfig;
