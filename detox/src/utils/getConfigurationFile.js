const path = require('path');
const packageJson = 'package.json';
const detoxRc = '.detoxrc';

function requireWithRoot(suffix) {
  return require(path.resolve(suffix))
}

function getDefaultConfigurationFile() {
  return path.resolve(packageJson);
}

function getConfigurationFile(configPath) {
    let config;

    console.log('Using config file', configPath)

    // If config path is provided, use it
    if (configPath) config = requireWithRoot(configPath);

    // if package.json contains detox object, use it
    if (!config) config = requireWithRoot(packageJson).detox;

    // fallback to .detoxrc
    if (!config) config = requireWithRoot(detoxRc);
    return config
  }

  module.exports = {getDefaultConfigurationFile, getConfigurationFile};
  