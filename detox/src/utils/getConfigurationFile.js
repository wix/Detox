const path = require('path');
const packageJson = 'package.json';
const detoxRc = '.detoxrc.json';

function getConfigurationFile(configPath) {
    let config;
    if (configPath) config = require(path.isAbsolute(configPath) ? configPath : path.join(process.cwd(), configPath));
    if (!config) config = require(path.join(process.cwd(), packageJson)).detox;
    if (!config) {
      try {
        config = require(path.join(process.cwd(), detoxRc));
      } catch (error) {}
    }
    return config
  }

  module.exports = getConfigurationFile;
  