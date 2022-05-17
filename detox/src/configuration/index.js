// @ts-nocheck
const _ = require('lodash');

const DetoxConfigErrorComposer = require('../errors/DetoxConfigErrorComposer');

const collectCliConfig = require('./collectCliConfig');
const composeAppsConfig = require('./composeAppsConfig');
const composeArtifactsConfig = require('./composeArtifactsConfig');
const composeBehaviorConfig = require('./composeBehaviorConfig');
const composeDeviceConfig = require('./composeDeviceConfig');
const composeRunnerConfig = require('./composeRunnerConfig');
const composeSessionConfig = require('./composeSessionConfig');
const loadExternalConfig = require('./loadExternalConfig');
const selectConfiguration = require('./selectConfiguration');

async function composeDetoxConfig({
  cwd = process.cwd(),
  argv = undefined,
  errorComposer = new DetoxConfigErrorComposer(),
  override,
}) {
  const cliConfig = collectCliConfig({ argv });
  const findupResult = await loadExternalConfig({
    errorComposer,
    configPath: cliConfig.configPath,
    cwd,
  });

  const externalConfig = findupResult && findupResult.config;
  errorComposer.setDetoxConfigPath(findupResult && findupResult.filepath);
  errorComposer.setDetoxConfig(externalConfig);

  /** @type {Detox.DetoxConfig} */
  const globalConfig = _.merge({}, externalConfig, override);
  if (_.isEmpty(globalConfig) && !externalConfig) {
    // Advise to create .detoxrc somewhere
    throw errorComposer.noConfigurationSpecified();
  }
  errorComposer.setDetoxConfig(globalConfig);

  const { configurations } = globalConfig;

  const runnerConfig = composeRunnerConfig({
    globalConfig,
    cliConfig,
  });

  const configurationName = selectConfiguration({
    errorComposer,
    globalConfig,
    cliConfig,
  });

  const localConfig = configurations[configurationName];

  if (localConfig['type']) {
    throw errorComposer.configurationShouldNotUseLegacyFormat();
  }

  const deviceConfig = composeDeviceConfig({
    errorComposer,
    globalConfig,
    localConfig,
    cliConfig,
  });

  const appsConfig = composeAppsConfig({
    errorComposer,
    configurationName,
    deviceConfig,
    globalConfig,
    localConfig,
    cliConfig,
  });

  const artifactsConfig = composeArtifactsConfig({
    configurationName,
    globalConfig,
    localConfig,
    cliConfig,
  });

  const behaviorConfig = composeBehaviorConfig({
    globalConfig,
    localConfig,
    cliConfig,
  });

  const sessionConfig = await composeSessionConfig({
    errorComposer,
    globalConfig,
    localConfig,
    cliConfig,
  });

  const result = {
    appsConfig,
    artifactsConfig,
    behaviorConfig,
    cliConfig,
    configurationName,
    deviceConfig,
    errorComposer,
    runnerConfig,
    sessionConfig,
  };

  return result;
}

module.exports = {
  composeDetoxConfig,
};
