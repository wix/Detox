const _ = require('lodash');
const DetoxConfigError = require('../errors/DetoxConfigError');
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
  const cliConfig = collectCliConfig({ argv });
  const findupResult = await loadExternalConfig({
    configPath: cliConfig.configPath,
    cwd,
  });

  const externalConfig = findupResult && findupResult.config;
  const detoxConfig = _.merge({}, externalConfig, override);

  if (_.isEmpty(detoxConfig)) {
    throw new DetoxConfigError({
      message: 'Cannot start Detox without a configuration',
      hint: 'Make sure your package.json has "detox" section, or there\'s .detoxrc file in the working directory',
    });
  }

  const configName = selectConfiguration({
    detoxConfig,
    cliConfig,
  });

  const runnerConfig = composeRunnerConfig({
    cliConfig,
    detoxConfig,
  });

  const deviceConfig = composeDeviceConfig({
    cliConfig,
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
    detoxConfig,
    deviceConfig,
  });

  return {
    artifactsConfig,
    behaviorConfig,
    deviceConfig,
    runnerConfig,
    sessionConfig,
    meta: {
      configuration: configName,
      location: findupResult && findupResult.filepath,
      cliConfig,
    },
  };
}

module.exports = {
  composeDetoxConfig,

  throwOnEmptyBinaryPath() {
    throw new DetoxConfigError({
      message: `'binaryPath' property is missing, should hold the app binary path`,
    });
  },
};
