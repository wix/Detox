// @ts-nocheck
const path = require('path');

const findUp = require('find-up');
const fs = require('fs-extra');
const _ = require('lodash');
const resolveFrom = require('resolve-from');

const log = require('../utils/logger').child({ cat: 'config' });

async function locateExternalConfig(cwd) {
  return findUp([
    '.detoxrc.cjs',
    '.detoxrc.js',
    '.detoxrc.json',
    '.detoxrc',
    'detox.config.cjs',
    'detox.config.js',
    'detox.config.json',
    'package.json',
  ], { cwd });
}

async function loadConfig(configPath) {
  let config = isJS(path.extname(configPath))
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

function isJS(ext) {
  return ext === '.js' || ext === '.cjs';
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

async function tryExtendConfig({ config, errorComposer, cwd }) {
  if (!config || !config.extends) {
    return config;
  }

  const { config: baseConfig } = await loadExternalConfig({
    configPath: config.extends,
    errorComposer: errorComposer.clone().setExtends(true),
    cwd,
  });

  return _.merge({}, baseConfig, config);
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

    let result;
    try {
      result = await loadConfig(resolvedConfigPath);
    } catch (e) {
      throw errorComposer.failedToReadConfiguration(e);
    }

    result.config = await tryExtendConfig({
      config: result.config,
      cwd: path.dirname(resolvedConfigPath),
      errorComposer,
    });

    return result;
  } else if (configPath) {
    throw errorComposer.noConfigurationAtGivenPath(configPath);
  }

  return null;
}

module.exports = loadExternalConfig;
