const _ = require('lodash');
const Detox = require('./Detox');
const DetoxConstants = require('./DetoxConstants');
const platform = require('./platform');
const exportWrapper = require('./exportWrapper');
const argparse = require('./utils/argparse');
const log = require('./utils/logger').child({ __filename });
const logError = require('./utils/logError');
const onTerminate = require('./utils/onTerminate');
const configuration = require('./configuration');

let detox;

function getDeviceConfig(configurations) {
  const configurationName = argparse.getArgValue('configuration');

  const deviceConfig = (!configurationName && _.size(configurations) === 1)
    ? _.values(configurations)[0]
    : configurations[configurationName];

  if (!deviceConfig) {
    throw new Error(`Cannot determine which configuration to use. use --configuration to choose one of the following:
                      ${Object.keys(configurations)}`);
  }
  if (!deviceConfig.type) {
    configuration.throwOnEmptyType();
  }

  if (!deviceConfig.name) {
    configuration.throwOnEmptyName();
  }

  return deviceConfig;
}

async function initializeDetox(config, params) {
  if (!config) {
    throw new Error(`No configuration was passed to detox, make sure you pass a config when calling 'detox.init(config)'`);
  }

  if (!(config.configurations && _.size(config.configurations) >= 1)) {
    throw new Error(`No configured devices`);
  }

  const {configurations, session} = config;
  const deviceConfig = getDeviceConfig(configurations);

  detox = new Detox({deviceConfig, session});
  await detox.init(params);
  platform.set(deviceConfig.type, detox.device);
}

async function init(config, params) {
  try {
    await initializeDetox(config, params);
  } catch (err) {
    logError(log, err);
    await cleanup();

    detox = null;
    throw err;
  }
}

async function beforeEach(testSummary) {
  if (detox) {
    await detox.beforeEach(testSummary);
  }
}

async function afterEach(testSummary) {
  if (detox) {
    await detox.afterEach(testSummary);
  }
}

async function cleanup() {
    if (detox) {
        await detox.cleanup();
    }
}

/* istanbul ignore next */
onTerminate(() => detox && detox.terminate());

module.exports = Object.assign({
  init,
  cleanup,
  beforeEach,
  afterEach,
  DetoxConstants
}, exportWrapper);
