const DetoxServer = require('../src/server/DetoxServer');
const log = require('../src/utils/logger').child({ __filename: 'detox-run-server' });
const catchAndLog = require('./utils/catchAndLog');

module.exports.command = 'run-server';
module.exports.desc = 'Start a standalone Detox server';
module.exports.builder = {
  port: {
    alias: 'p',
    describe: 'Port number',
    number: true,
    default: 8099
  },
  loglevel: {
    alias: 'l',
    choices: ['fatal', 'error', 'warn', 'info', 'verbose', 'trace'],
    describe: 'Log level'
  },
  'no-color': {
    describe: 'Disable colorful logs',
    boolean: true
  }
};

module.exports.handler = catchAndLog(log, function main(argv) {
  if (isNaN(argv.port) || argv.port < 1 || argv.port > 65535) {
    throw new Error(`The port should be between 1 and 65535, got ${argv.port}`)
  }

  new DetoxServer({
    port: +argv.port,
    log,
  });
});
