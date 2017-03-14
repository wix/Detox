#!/usr/bin/env node

const _ = require('lodash');
const program = require('commander');
const path = require('path');
const cp = require('child_process');
program
  .option('-d, --configuration [device configuration]', `[convince method] run the command defined in 'configuration.build'`)
  .parse(process.argv);

const config = require(path.join(process.cwd(), 'package.json')).detox;

let buildScript;
if (program.configuration) {
  buildScript = _.result(config, `configurations["${program.configuration}"].build`);
} else if (_.size(config.configurations) === 1) {
  buildScript = _.values(config.configurations)[0].build;
}

if (buildScript) {
  console.log(buildScript);
  cp.execSync(buildScript, {stdio: 'inherit'});
} else {
  throw new Error(`Could not find build script in detox.configurations["${program.configuration}"]`);
}
