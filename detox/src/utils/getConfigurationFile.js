const path = require('path');
const packageJson = 'package.json';
const detoxRc = '.detoxrc';

function requireWithRoot(suffix) {
  return require(path.join(process.cwd(), suffix))
}

function getDefaultConfigurationFile() {
  return requireWithRoot(packageJson);
}

function getConfigurationFile(configPath) {
    let config;
    if (configPath) config = path.isAbsolute(configPath) ? require(configPath) : requireWithRoot(configPath);
    if (!config) config = requireWithRoot(packageJson).detox;
    if (!config) config = requireWithRoot(detoxRc);
    return config
  }

  module.exports = {getDefaultConfigurationFile, getConfigurationFile};
  