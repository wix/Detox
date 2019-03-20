const _ = require('lodash');
const cp = require('child_process');
const log = require('../src/utils/logger').child({ __filename: 'detox-build' });
const catchAndLog = require('./utils/catchAndLog');
const {getDefaultConfiguration, getConfigurationByKey} = require('./utils/configurationUtils');

module.exports.command = 'build';
module.exports.desc = "[convenience method] Run the command defined in 'configuration.build'";
module.exports.builder = {
  c: {
    alias: 'configuration',
    default: () => getDefaultConfiguration(),
    describe:
      "Select a device configuration from your defined configurations, if not supplied, and there's only one configuration, detox will default to it"
  }
};

module.exports.handler = catchAndLog(log, function(argv) {
  const buildScript = getConfigurationByKey(argv.configuration).build;

  if (buildScript) {
    log.info(buildScript);
    cp.execSync(buildScript, { stdio: 'inherit' });
  } else {
    throw new Error(`Could not find build script in detox.configurations["${argv.configuration}"].build`);
  }
});
