#!/usr/bin/env node

const program = require('commander');

program
  .arguments('<process>')
  .command('test', 'starts the tests')
  .command('build', `[convince method] run the command defined in 'device.build'`)
  .command('run-server', 'starts the detox server')
  .parse(process.argv);
