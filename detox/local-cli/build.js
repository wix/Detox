const _ = require('lodash');
const cp = require('child_process');
const log = require('../src/utils/logger').child({ __filename });
const {getDefaultConfiguration, getConfigurationByKey} = require('./utils/configurationUtils');

module.exports.command = 'build';
module.exports.desc = "Convenience method. Run the command defined in 'build' property of the specified configuration.";
module.exports.builder = {
  c: {
    alias: 'configuration',
    group: 'Configuration:',
    describe:
      "Select a device configuration from your defined configurations, if not supplied, and there's only one configuration, detox will default to it",
    default: getDefaultConfiguration(),
  }
};

module.exports.handler = async function build(argv) {
  const buildScript = getConfigurationByKey(argv.configuration).build;

  if (buildScript) {
    log.info(buildScript);
    cp.execSync(buildScript, { stdio: 'inherit' });
  } else {
    throw new Error(`Could not find build script in detox.configurations["${argv.configuration}"].build`);
  }
};
