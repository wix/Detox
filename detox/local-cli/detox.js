#!/usr/bin/env node

const program = require('commander');

program
  .arguments('<process>')
  .command('test', 'Initiating your test suite')
  .command('build', `[convince method] Run the command defined in 'device.build'`)
  .command('run-server', 'Starts a standalone detox server')
  .parse(process.argv);
