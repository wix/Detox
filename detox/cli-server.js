#! /usr/bin/env node

const log = require('npmlog');
const program = require('commander');

program
  .arguments('<process>')
  .parse(process.argv);

//console.log('server');
log.verbose('server');
