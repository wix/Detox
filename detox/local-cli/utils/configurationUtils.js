const _ = require('lodash');
const { cosmiconfigSync } = require('cosmiconfig');

const explorer = cosmiconfigSync("detox")

function hintConfigurations(configurations) {
  return Object.keys(configurations).map(c => `* ${c}`).join('\n')
}

function getDetoxConfig(pathToConfig = process.cwd()) {
  const result = explorer.search(pathToConfig);
  if (!result || !result.config) {
    throw new Error('Cannot find detox configuration');
  }

  return result.config;
}

function getDefaultConfiguration(pathToConfig) {
  try {
    const { configurations } = getDetoxConfig(pathToConfig);
    const keys = Object.keys(configurations);
    if (keys.length === 1) {
      return keys[0];
    }
  } catch (err) {}

  return undefined;
}

function getConfigurationByKey(key) {
  const { configurations } = getDetoxConfig();

  if (_.isEmpty(configurations)) {
    throw new Error('There are no "configurations" in "detox" section of package.json');
  }

  if (!key) {
    throw new Error(
      `Cannot determine which configuration to use. Use --configuration to choose one of the following:\n`
      + hintConfigurations(configurations)
    );
  }

  const configuration = configurations[key];
  if (!configuration) {
    throw new Error(
      `Configuration "${key}" is missing in detox section of package.json. Make sure you choose one of the following:\n`
      + hintConfigurations(configurations)
    );
  }

  return configuration;
}

module.exports = {
  getDetoxConfig,
  getDefaultConfiguration,
  getConfigurationByKey,
};
