const _ = require('lodash');
const DetoxConfigErrorComposer = require('../errors/DetoxConfigErrorComposer');
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
  cwd = process.cwd(),
  argv,
  override,
  userParams,
}) {
  const errorComposer = new DetoxConfigErrorComposer();
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
    userParams,
    cliConfig,
  });

  const sessionConfig = await composeSessionConfig({
    errorComposer,
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
    errorComposer,
  };
}

module.exports = {
  composeDetoxConfig,
};
