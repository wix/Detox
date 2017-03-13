#!/usr/bin/env node

const _ = require('lodash');
const program = require('commander');
const path = require('path');
const cp = require('child_process');
program
  .option('-d, --device [device]', `[convince method] run the command defined in 'device.build'`)
  .parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
  process.exit(0);
}

const config = require(path.join(process.cwd(), 'package.json')).detox;
const buildScript = _.result(config, `devices["${program.device}"].build`);

if (buildScript) {
  console.log(buildScript);
  cp.execSync(buildScript, {stdio: 'inherit'});
} else {
  throw new Error(`Could not find build script in detox.devices["${program.device}"]`);
}
