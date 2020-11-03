const _ = require('lodash');
const DetoxConfigErrorBuilder = require('../errors/DetoxConfigErrorBuilder');
const collectCliConfig = require('./collectCliConfig');
const loadExternalConfig = require('./loadExternalConfig');
const composeArtifactsConfig = require('./composeArtifactsConfig');
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

  const detoxConfig = _.merge({}, externalConfig, override);
  if (_.isEmpty(detoxConfig) && !externalConfig) {
    // Advise to create .detoxrc somewhere
    throw errorBuilder.noConfigurationSpecified();
  }

  errorBuilder.setDetoxConfig(detoxConfig);
  const configName = selectConfiguration({
    errorBuilder,
    detoxConfig,
    cliConfig,
  });

  const runnerConfig = composeRunnerConfig({
    cliConfig,
    detoxConfig,
  });

  const deviceConfig = composeDeviceConfig({
    cliConfig,
    errorBuilder,
    rawDeviceConfig: detoxConfig.configurations[configName],
    configurationName: configName,
  });

  const artifactsConfig = composeArtifactsConfig({
    cliConfig,
    configurationName: configName,
    detoxConfig,
    deviceConfig,
  });

  const behaviorConfig = composeBehaviorConfig({
    cliConfig,
    detoxConfig,
    deviceConfig,
    userParams
  });

  const sessionConfig = await composeSessionConfig({
    cliConfig,
    detoxConfig,
    deviceConfig,
    errorBuilder,
  });

  return {
    artifactsConfig,
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
