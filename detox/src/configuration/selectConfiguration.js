const _ = require('lodash');

/**
 * @param {DetoxConfigErrorBuilder} errorBuilder
 * @param {*} detoxConfig
 * @param {*} cliConfig
 * @returns {string}
 */
function selectConfiguration({ errorBuilder, detoxConfig, cliConfig }) {
  const { configurations } = detoxConfig;

  if (_.isEmpty(configurations)) {
    throw errorBuilder.noDeviceConfigurationsInside();
  }

  let configurationName = cliConfig.configuration || detoxConfig.selectedConfiguration;
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
