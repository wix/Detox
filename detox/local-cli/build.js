const _ = require('lodash');
const cp = require('child_process');
const log = require('../src/utils/logger').child({ __filename });
const {composeDetoxConfig} = require('../src/configuration');

module.exports.command = 'build';
module.exports.desc = "Runs the user-provided build command, as defined in the 'build' property of the specified configuration.";
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
  const { errorBuilder, deviceConfig } = await composeDetoxConfig({ argv });

  const buildScript = deviceConfig.build;

  if (buildScript) {
    log.warn("\n\nImportant: 'detox build' is a convenience shortcut for calling your own build command, as provided in the config file.\nFailures in this build command are not the responsibility of Detox. You are responsible for mainting this command.\n");
    log.info(buildScript);
    cp.execSync(buildScript, { stdio: 'inherit' });
  } else {
    throw errorBuilder.missingBuildScript();
  }
};
