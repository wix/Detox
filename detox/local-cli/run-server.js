const collectCliConfig = require('../src/configuration/collectCliConfig');
const composeLoggerConfig = require('../src/configuration/composeLoggerConfig');
const { DetoxRuntimeError } = require('../src/errors');
const logger = require('../src/utils/logger');
const WebDriverServer = require('../src/webdriver');

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
    default: 5789
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

  await logger.setConfig(composeLoggerConfig({
    // @ts-ignore
    globalConfig: {},
    // @ts-ignore
    localConfig: {},
    cliConfig: collectCliConfig({ argv }),
  }));

  await new WebDriverServer({
    port: +argv.port,
  }).startServer();

  console.log(`Detox server listening on localhost:${argv.port}...`);
};
