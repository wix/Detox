const log = require('npmlog');
const WebsocketClient = require('./websocket');
const expect = require('./ios/expect');
const Simulator = require('./devices/simulator');
const argparse = require('./utils/argparse');
const InvocationManager = require('./invoke').InvocationManager;
const configuration = require('./configuration');

log.level = argparse.getArgValue('loglevel') || 'info';
log.heading = 'detox';

let websocket;
let _detoxConfig;

function config(detoxConfig) {
  configuration.validateConfig(detoxConfig);
  _detoxConfig = detoxConfig || configuration.defaultConfig;
}

function start(done) {
  expect.exportGlobals();

  websocket = new WebsocketClient(_detoxConfig.session);
  global.simulator = new Simulator(websocket, _detoxConfig);

  const invocationManager = new InvocationManager(websocket);
  expect.setInvocationManager(invocationManager);

  websocket.connect(async() => {
    const target = argparse.getArgValue('target') || 'ios-sim';
    if (target === 'ios-sim') {
      await simulator.prepare(done);
    } else {
      done();
    }
  });
}

function cleanup(done) {
  websocket.cleanup(done);
}

function waitForTestResult(done) {
  websocket.waitForTestResult(done);
}

async function openURL(url, onComplete) {
  const target = argparse.getArgValue('target') || 'ios-sim';
  if (target === 'ios-sim') {
    await simulator.openURL(url);
  }
  onComplete();
}

// if there's an error thrown, close the websocket,
// if not, mocha will continue running until reaches timeout.
process.on('uncaughtException', (err) => {
  //websocket.close();

  throw err;
});

process.on('unhandledRejection', (reason, p) => {
  //websocket.close();

  throw reason;
});

module.exports = {
  config,
  start,
  cleanup,
  waitForTestResult,
  openURL
};
