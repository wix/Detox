const _ = require('lodash');

/**
 * @param {require('../errors/DetoxConfigErrorBuilder')} errorBuilder
 * @param {Detox.DetoxConfig} detoxConfig
 * @param {*} cliConfig
 * @returns {string}
 */
function selectConfiguration({ errorBuilder, globalConfig, cliConfig }) {
  const { configurations } = globalConfig;

  if (_.isEmpty(configurations)) {
    throw errorBuilder.noConfigurationsInside();
  }

  let configurationName = cliConfig.configuration || globalConfig.selectedConfiguration;
  if (!configurationName && _.size(configurations) === 1) {
    configurationName = _.keys(configurations)[0];
  }

  if (!configurationName) {
    throw errorBuilder.cantChooseConfiguration();
  }

  errorBuilder.setConfigurationName(configurationName);

  if (!configurations.hasOwnProperty(configurationName)) {
    throw errorBuilder.noConfigurationWithGivenName();
  }

  if (_.isEmpty(configurations[configurationName])) {
    throw errorBuilder.configurationShouldNotBeEmpty();
  }

  return configurationName;
}

module.exports = selectConfiguration;
