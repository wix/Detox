const _ = require('lodash');
const cp = require('child_process');
const log = require('../src/utils/logger').child({ __filename });
const {composeDetoxConfig} = require('../src/configuration');
const DetoxConfigError = require('../src/errors/DetoxConfigError');

module.exports.command = 'build';
module.exports.desc = "Convenience method. Run the command defined in 'build' property of the specified configuration.";
module.exports.builder = {
  C: {
    alias: 'config-path',
    group: 'Configuration:',
    describe: 'Specify Detox config file path. If not supplied, detox searches for .detoxrc[.js] or "detox" section in package.json',
  },
  c: {
    alias: 'configuration',
    group: 'Configuration:',
    describe:
      "Select a device configuration from your defined configurations, if not supplied, and there's only one configuration, detox will default to it",
  },
};

module.exports.handler = async function build(argv) {
  const { meta, deviceConfig } = await composeDetoxConfig({ argv });

  const buildScript = deviceConfig.build;

  if (buildScript) {
    log.info(buildScript);
    cp.execSync(buildScript, { stdio: 'inherit' });
  } else {
    throw new DetoxConfigError({
      message: `Could not find a build script inside "${meta.configuration}" configuration.`,
      hint: meta.location && `Check contents of your Detox config at: ${meta.location}`,
      debugInfo: deviceConfig,
    });
  }
};
