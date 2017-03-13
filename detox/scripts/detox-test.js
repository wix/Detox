#!/usr/bin/env node

const program = require('commander');
const path = require('path');
const cp = require('child_process');
program
  .option('-r, --runner [runner]', 'test runner', 'mocha')
  .option('-c, --runner-config [config]', 'test runner config file', 'mocha.opts')
  .option('-l, --loglevel [value]', 'info, debug, verbose, silly')
  .parse(process.argv);

const config = require(path.join(process.cwd(), 'package.json')).detox;
const testFolder = config.specs || 'e2e';

console.log('runner', program.runner);

let command;
switch (program.runner) {
  case 'mocha':
    command = `node_modules/.bin/${program.runner} ${testFolder} --opts ${testFolder}/${program.runnerConfig} --loglevel ${program.loglevel}`;
    break;
  default:
    throw new Error(`${program.runner} is not supported in detox cli tools. You can still runb your tests with the runner's own cli tool`);
}

console.log(command);
cp.execSync(command, {stdio: 'inherit'});
