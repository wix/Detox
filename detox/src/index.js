const log = require('npmlog');
const expect = require('./ios/expect');
const Simulator = require('./devices/simulator');
const argparse = require('./utils/argparse');
const InvocationManager = require('./invoke').InvocationManager;
const configuration = require('./configuration');
const Client = require('./client/client');

log.level = argparse.getArgValue('loglevel') || 'info';
log.heading = 'detox';

let client;
let _detoxConfig;

function config(detoxConfig) {
  configuration.validateConfig(detoxConfig);
  _detoxConfig = detoxConfig || configuration.defaultConfig;
}

async function start() {
  expect.exportGlobals();

  client = new Client(_detoxConfig.session);
  client.connect();
  global.simulator = new Simulator(client, _detoxConfig);

  const invocationManager = new InvocationManager(client);
  expect.setInvocationManager(invocationManager);

  await simulator.prepare();
}

async function cleanup() {
  await client.cleanup();
}

async function openURL(url) {
  const target = argparse.getArgValue('target') || 'ios-sim';
  if (target === 'ios-sim') {
    await simulator.openURL(url);
  }
}

// if there's an error thrown, close the websocket,
// if not, mocha will continue running until reaches timeout.
process.on('uncaughtException', (err) => {
  //client.close();

  throw err;
});

process.on('unhandledRejection', (reason, p) => {
  //client.close();

  throw reason;
});

module.exports = {
  config,
  start,
  cleanup,
  openURL
};
