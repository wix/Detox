const _ = require('lodash');
const DetoxConfigErrorBuilder = require('../errors/DetoxConfigErrorBuilder');
const collectCliConfig = require('./collectCliConfig');
const loadExternalConfig = require('./loadExternalConfig');
const composeArtifactsConfig = require('./composeArtifactsConfig');
const composeAppsConfig = require('./composeAppsConfig');
const composeBehaviorConfig = require('./composeBehaviorConfig');
const composeDeviceConfig = require('./composeDeviceConfig');
const composeRunnerConfig = require('./composeRunnerConfig');
const composeSessionConfig = require('./composeSessionConfig');
const selectConfiguration = require('./selectConfiguration');

async function composeDetoxConfig({
  cwd,
  argv,
  override,
  userParams,
}) {
  const errorBuilder = new DetoxConfigErrorBuilder();
  const cliConfig = collectCliConfig({ argv });
  const findupResult = await loadExternalConfig({
    errorBuilder,
    configPath: cliConfig.configPath,
    cwd,
  });

  const externalConfig = findupResult && findupResult.config;
  errorBuilder.setDetoxConfigPath(findupResult && findupResult.filepath);
  errorBuilder.setDetoxConfig(externalConfig);

  /** @type {Detox.DetoxConfig} */
  const globalConfig = _.merge({}, externalConfig, override);
  if (_.isEmpty(globalConfig) && !externalConfig) {
    // Advise to create .detoxrc somewhere
    throw errorBuilder.noConfigurationSpecified();
  }
  errorBuilder.setDetoxConfig(globalConfig);

  const { configurations } = globalConfig;

  const runnerConfig = composeRunnerConfig({
    globalConfig,
    cliConfig,
  });

  const configurationName = selectConfiguration({
    errorBuilder,
    globalConfig,
    cliConfig,
  });

  const localConfig = configurations[configurationName];

  const deviceConfig = composeDeviceConfig({
    errorBuilder,
    globalConfig,
    localConfig,
    cliConfig,
  });

  const appsConfig = composeAppsConfig({
    errorBuilder,
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
    userParams,
    cliConfig,
  });

  const sessionConfig = await composeSessionConfig({
    errorBuilder,
    globalConfig,
    localConfig,
    cliConfig,
  });

  return {
    artifactsConfig,
    appsConfig,
    behaviorConfig,
    cliConfig,
    deviceConfig,
    runnerConfig,
    sessionConfig,
    errorBuilder,
  };
}

module.exports = {
  composeDetoxConfig,
};
