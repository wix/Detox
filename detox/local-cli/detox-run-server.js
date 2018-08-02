#!/usr/bin/env node

const program = require('commander');
const DetoxServer = require('../src/server/DetoxServer');
const logger = require('../src/utils/logger');

program
  .name('detox run-server')
  .description('Start a standalone Detox server')
  .option(
    '-p, --port [port]',
    'Port number',
    '8099'
  )
  .option('-l, --loglevel [value]',
    'Log level: fatal, error, warn, info, verbose, trace', 'info')
  .option(
    '--no-color',
    'Disable colorful logs',
    false
  )
  .parse(process.argv);

if (program.port < 1 || program.port > 65535) {
  program.help();
}

const detoxServer = new DetoxServer({
  port: +program.port,
  log: logger,
});
