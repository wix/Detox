const _ = require('lodash');

const DetoxConfigError = require('../errors/DetoxConfigError');

function hintConfigurations(configurations) {
  return _.keys(configurations).map(c => `* ${c}`).join('\n')
}

function selectConfiguration({ detoxConfig, cliConfig }) {
  const { configurations } = detoxConfig;

  if (_.isEmpty(configurations)) {
    throw new DetoxConfigError({
      message: `There are no device configurations in the given Detox config:`,
      debugInfo: detoxConfig,
      inspectOptions: { depth: 1 },
    });
  }

  let configurationName = cliConfig.configuration || detoxConfig.selectedConfiguration;
  if (!configurationName && _.size(configurations) === 1) {
    configurationName = _.keys(configurations)[0];
  }

  if (!configurationName) {
    throw new DetoxConfigError({
      message: 'Cannot determine which configuration to use.',
      hint: 'Use --configuration to choose one of the following:\n' + hintConfigurations(configurations),
    });
  }

  if (!configurations.hasOwnProperty(configurationName)) {
    throw new DetoxConfigError({
      message: `Failed to find a configuration named "${configurationName}" in Detox config`,
      hint: 'Below are the configurations Detox has been able to find:\n' + hintConfigurations(configurations),
    });
  }

  return configurationName;
}

module.exports = selectConfiguration;
