const fs = require('fs-extra');
const path = require('path');
const findUp = require('find-up');

async function locateExternalConfig(cwd) {
  return findUp([
    '.detoxrc.js',
    '.detoxrc.json',
    '.detoxrc',
    'detox.config.js',
    'detox.config.json',
    'package.json',
  ], { cwd });
}

async function loadConfig(configPath) {
  let config = path.extname(configPath) === '.js'
    ? require(configPath)
    : JSON.parse(await fs.readFile(configPath, 'utf8'));

  if (path.basename(configPath) === 'package.json') {
    config = config.detox;
  }

  return {
    config,
    filepath: configPath,
  };
}

async function loadExternalConfig({ configPath, cwd }) {
  const resolvedConfigPath = configPath || await locateExternalConfig(cwd);

  if (resolvedConfigPath) {
    return loadConfig(resolvedConfigPath);
  }

  return null;
}

module.exports = loadExternalConfig;
