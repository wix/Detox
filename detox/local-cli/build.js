const _ = require('lodash');
const path = require('path');
const cp = require('child_process');


module.exports.command = 'build'
module.exports.desc = "[convenience method] Run the command defined in 'configuration.build'"
module.exports.builder = {
  configuration: {
    alias: 'c',
    describe: 'Select a device configuration from your defined configurations, if not supplied, and there\'s only one configuration, detox will default to it'
  }
}

module.exports.handler = function (argv) {
  const config = require(path.join(process.cwd(), 'package.json')).detox;

  let buildScript;
  if (argv.configuration) {
    buildScript = _.result(config, `configurations["${argv.configuration}"].build`);
  } else if (_.size(config.configurations) === 1) {
    buildScript = _.values(config.configurations)[0].build;
  } else {
    throw new Error(`Cannot determine which configuration to use. use --configuration to choose one of the following: 
                        ${Object.keys(config.configurations)}`);
  }
  
  if (buildScript) {
    console.log(buildScript);
    cp.execSync(buildScript, {stdio: 'inherit'});
  } else {
    throw new Error(`Could not find build script in detox.configurations["${argv.configuration}"]`);
  }
}
