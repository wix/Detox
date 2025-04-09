// @ts-nocheck
const _ = require('lodash');

const DetoxConfigErrorComposer = require('../errors/DetoxConfigErrorComposer');

const collectCliConfig = require('./collectCliConfig');
const composeAppsConfig = require('./composeAppsConfig');
const composeArtifactsConfig = require('./composeArtifactsConfig');
const composeBehaviorConfig = require('./composeBehaviorConfig');
const composeCommandsConfig = require('./composeCommandsConfig');
const composeDeviceConfig = require('./composeDeviceConfig');
const composeLoggerConfig = require('./composeLoggerConfig');
const composeRunnerConfig = require('./composeRunnerConfig');
const composeSessionConfig = require('./composeSessionConfig');
const loadExternalConfig = require('./loadExternalConfig');
const selectConfiguration = require('./selectConfiguration');

async function composeDetoxConfig({
  cwd = process.cwd(),
  argv = undefined,
  testRunnerArgv = undefined,
  errorComposer = new DetoxConfigErrorComposer(),
  override = undefined,
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

  const configurationName = selectConfiguration({
    errorComposer,
    globalConfig,
    cliConfig,
  });

  const localConfig = configurations[configurationName];

  if (localConfig['type']) {
    throw errorComposer.configurationShouldNotUseLegacyFormat();
  }

  const runnerConfig = composeRunnerConfig({
    globalConfig,
    localConfig,
    cliConfig,
    testRunnerArgv,
    errorComposer,
  });

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

  const loggerConfig = composeLoggerConfig({
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

  const commandsConfig = composeCommandsConfig({
    appsConfig,
    localConfig,
  });

  const result = {
    configurationName,

    apps: appsConfig,
    artifacts: artifactsConfig,
    behavior: behaviorConfig,
    cli: cliConfig,
    commands: commandsConfig,
    device: deviceConfig,
    logger: loggerConfig,
    testRunner: runnerConfig,
    session: sessionConfig,
  };

  Object.defineProperty(result, 'errorComposer', {
    enumerable: false,
    value: errorComposer,
  });

  return result;
}

module.exports = {
  composeDetoxConfig,
};
