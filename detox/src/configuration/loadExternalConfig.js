const fs = require('fs-extra');
const path = require('path');
const findUp = require('find-up');
const resolveFrom = require('resolve-from');
const log = require('../utils/logger').child({ __filename });

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

async function resolveConfigPath(configPath, cwd) {
  if (!configPath) {
    return locateExternalConfig(cwd);
  }

  const viaNodeResolution = resolveFrom.silent(cwd, configPath);
  if (viaNodeResolution) {
    return viaNodeResolution;
  }

  if (fs.existsSync(configPath)) {
    log.warn('Cannot resolve Detox config path by using Node.js require() mechanism:\n' +
      `require(${JSON.stringify(configPath)})\n\n` +
      'Detox now will resort to legacy filesystem-based path resolution.\n' +
      'Please fix your config path, so it conforms to `require(modulePath)` resolution.');

    return path.resolve(configPath);
  }

  return null;
}

/**
 * @param {DetoxConfigErrorComposer} errorComposer
 * @param {string} configPath
 * @param {string} cwd
 * @returns {Promise<null|{filepath: *, config: any}>}
 */
async function loadExternalConfig({ errorComposer, configPath, cwd }) {
  const resolvedConfigPath = await resolveConfigPath(configPath, cwd);

  if (resolvedConfigPath) {
    errorComposer.setDetoxConfigPath(resolvedConfigPath);

    try {
      return await loadConfig(resolvedConfigPath);
    } catch (e) {
      throw errorComposer.failedToReadConfiguration(e);
    }
  } else if (configPath) {
    throw errorComposer
      .setDetoxConfigPath(configPath)
      .noConfigurationAtGivenPath();
  }

  return null;
}

module.exports = loadExternalConfig;
