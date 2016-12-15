#!/usr/bin/env node

const program = require('commander');

program
  .arguments('<process>')
  .command('test', 'starts the tests')
  .command('run-server', 'starts the detox server')
  .parse(process.argv);
