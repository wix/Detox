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

/**
 * @param {DetoxConfigErrorBuilder} errorBuilder
 * @param {string} configPath
 * @param {string} cwd
 * @returns {Promise<null|{filepath: *, config: any}>}
 */
async function loadExternalConfig({ errorBuilder, configPath, cwd }) {
  const resolvedConfigPath = configPath
    ? path.resolve(configPath)
    : await locateExternalConfig(cwd);

  if (resolvedConfigPath) {
    errorBuilder.setDetoxConfigPath(resolvedConfigPath);

    try {
      return await loadConfig(resolvedConfigPath);
    } catch (e) {
      if (/Cannot find module|ENOENT/.test(`${e}`)) {
        throw errorBuilder.noConfigurationAtGivenPath();
      } else {
        throw errorBuilder.failedToReadConfiguration(e);
      }
    }
  }

  return null;
}

module.exports = loadExternalConfig;
