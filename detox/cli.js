#! /usr/bin/env node

const log = require('npmlog');
const program = require('commander');

program
  .arguments('<process>')
  .command('server', 'starts the detox server')
  .option('-v, --verbose', 'verbose log ?', false)
  .option('--loglevel <level>', 'log level', /^(silly|verbose|info|warn|error)$/i, 'info')
  .parse(process.argv);

log.level = setLogLevel();

function setLogLevel() {
  if (program.verbose) {
    return 'verbose';
  }

  return program.loglevel;
}

log.verbose('cli');
