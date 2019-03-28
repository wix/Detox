const _ = require('lodash');
const path = require('path');

function hintConfigurations(configurations) {
  return Object.keys(configurations).map(c => `* ${c}`).join('\n')
}

function getDefaultPathToPackageJson() {
  return path.join(process.cwd(), 'package.json');
}

function getDetoxSection(pathToPackageJson = getDefaultPathToPackageJson()) {
  const { detox } = require(pathToPackageJson);
  if (!detox) {
    throw new Error('Cannot find "detox" section in package.json');
  }

  return detox;
}

function getDefaultConfiguration(pathToPackageJson = getDefaultPathToPackageJson()) {
  try {
    const configurations = require(pathToPackageJson).detox.configurations;
    const keys = Object.keys(configurations);
    if (keys.length === 1) {
      return keys[0];
    }
  } catch (err) {}

  return undefined;
}

function getConfigurationByKey(key) {
  const { configurations } = getDetoxSection();

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
  getDetoxSection,
  getDefaultConfiguration,
  getConfigurationByKey,
};
