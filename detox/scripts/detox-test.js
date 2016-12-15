#!/usr/bin/env node

const program = require('commander');
const path = require('path');
const child_process = require('child_process');
program
  .option('-r, --runner [runner]', 'test runner', 'mocha')
  .option('-r, --runner-config [config]', 'test runner config file', 'mocha.opts')
  .option('-d, --detox-verbose [value]', 'verbose mode')
  .parse(process.argv);

const config = require(path.join(process.cwd(), 'package.json')).detox;
const testFolder = config.specs || 'e2e';
const isDebug = program.detoxVerbose ? '--detox-verbose' : '';
console.log('isDebug' , isDebug);
console.log('runner' , program.runner);
const command = `${program.runner} ${testFolder} --opts ${testFolder}/${program.runnerConfig} ${isDebug}`;

child_process.execSync(command, {stdio: 'inherit'});