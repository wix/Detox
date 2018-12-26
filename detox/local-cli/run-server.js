const DetoxServer = require('../src/server/DetoxServer');
const logger = require('../src/utils/logger');


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
    default: false,
    boolean: true
  }
}

module.exports.handler = function main(argv) {
  if (isNaN(argv.port) || argv.port < 1 || argv.port > 65535) {
    throw new Error(`The port should be between 1 and 65535, got ${argv.port}`)
  }
  
  new DetoxServer({
    port: +argv.port,
    log: logger,
  });
}
