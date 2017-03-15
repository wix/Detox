#!/usr/bin/env node

const program = require('commander');
const path = require('path');
const cp = require('child_process');
program
  .option('-r, --runner [runner]', 'Test runner (currently supports mocha)', 'mocha')
  .option('-o, --runner-config [config]', 'Test runner config file', 'mocha.opts')
  .option('-l, --loglevel [value]', 'info, debug, verbose, silly')
  .option('-c, --configuration [configuration name]', 'Run test on this configuration')
  .parse(process.argv);

const config = require(path.join(process.cwd(), 'package.json')).detox;
const testFolder = config.specs || 'e2e';

const loglevel = program.loglevel ? `--loglevel ${program.loglevel}` : '';
const configuration = program.configuration ? `--configuration ${program.configuration}` : '';

let command;
switch (program.runner) {
  case 'mocha':
    command = `node_modules/.bin/${program.runner} ${testFolder} --opts ${testFolder}/${program.runnerConfig} ${configuration} ${loglevel}`;
    break;
  default:
    throw new Error(`${program.runner} is not supported in detox cli tools. You can still run your tests with the runner's own cli tool`);
}

console.log(command);
cp.execSync(command, {stdio: 'inherit'});
