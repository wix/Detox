/* eslint @typescript-eslint/no-unused-vars: ["error", { "args": "none" }] */
const _ = require('lodash');

const { castLevel, defaultOptions } = require('../logger/DetoxLogger');

/**
 * @param {object} opts
 * @param {Detox.DetoxConfig} opts.globalConfig
 * @param {Detox.DetoxConfiguration} opts.localConfig
 * @param {*} opts.cliConfig
 */
function composeLoggerConfig(opts) {
  const { globalConfig, localConfig, cliConfig } = opts;

  const items = [
    {
      level: 'info',
      overrideConsole: true,
      options: defaultOptions,
    },
    globalConfig.logger,
    localConfig.logger,
    adaptCLI(cliConfig),
  ];

  return items.reduce(
    /**
     * @param {Partial<Detox.DetoxLoggerConfig>} acc
     * @param config
     */
    (acc, config) => {
      if (!config) return acc;
      const { options } = config;
      return _.merge(acc, {
        // @ts-ignore-line
        options: typeof options === 'function' ? options(acc) : options
      });
    },
    items.reduce((a, b) => _.merge(a, _.omit(b, 'options')), {})
  );
}

function adaptCLI(cliConfig) {
  const result = {};

  if (cliConfig.loglevel !== undefined) {
    result.level = castLevel(cliConfig.loglevel);
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
