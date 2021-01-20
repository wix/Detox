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
    throw errorBuilder.noDeviceConfigurationsInside();
  }

  let configurationName = cliConfig.configuration || globalConfig.selectedConfiguration;
  if (!configurationName && _.size(configurations) === 1) {
    configurationName = _.keys(configurations)[0];
  }

  if (!configurationName) {
    throw errorBuilder.cantChooseDeviceConfiguration();
  }

  errorBuilder.setConfigurationName(configurationName);

  if (!configurations.hasOwnProperty(configurationName)) {
    throw errorBuilder.noDeviceConfigurationWithGivenName();
  }

  return configurationName;
}

module.exports = selectConfiguration;
