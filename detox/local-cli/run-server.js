const DetoxRuntimeError = require('../src/errors/DetoxRuntimeError');
const DetoxServer = require('../src/server/DetoxServer');

module.exports.command = 'run-server';
module.exports.desc = 'Start a standalone Detox server';
module.exports.builder = {
  l: {
    alias: 'loglevel',
    describe: 'Log level',
    group: 'Configuration:',
    choices: ['fatal', 'error', 'warn', 'info', 'verbose', 'trace'],
  },
  p: {
    alias: 'port',
    describe: 'Port number',
    group: 'Configuration:',
    number: true,
    default: 8099
  },
  'no-color': {
    describe: 'Disable colorful logs',
    boolean: true
  }
};

module.exports.handler = async function runServer(argv) {
  if (isNaN(argv.port) || argv.port < 1 || argv.port > 65535) {
    throw new DetoxRuntimeError(`The port should be between 1 and 65535, got ${argv.port}`);
  }

  await new DetoxServer({
    port: +argv.port,
    standalone: true,
  }).open();
};
