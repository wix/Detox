const log = require('npmlog');
const WebsocketClient = require('./websocket');
const expect = require('./ios/expect');
const Simulator = require('./devices/simulator');
const argparse = require('./utils/argparse');
const InvocationManager = require('./invoke').InvocationManager;

const loglevel = argparse.getArgValue('loglevel') ? argparse.getArgValue('loglevel') : 'info';
log.level = loglevel;
log.heading = 'detox';

let websocket;

let _detoxConfig = {
  session: {
    server: 'ws://localhost:8099',
    sessionId: 'example'
  }
};

function config(detoxConfig) {
  _validateConfig(detoxConfig);
  _detoxConfig = detoxConfig;
}

function start(done) {
  expect.exportGlobals();

  websocket = new WebsocketClient(_detoxConfig.session);
  global.simulator = new Simulator(websocket);

  const invocationManager = new InvocationManager(websocket);
  expect.setInvocationManager(invocationManager);

  websocket.connect(async() => {
    const target = argparse.getArgValue('target') || 'ios-sim';
    if (target === 'ios-sim') {
      await simulator.prepare(_detoxConfig, done);
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

function _validateConfig(detoxConfig) {
  if (!detoxConfig.session) {
    throw new Error(`No session configuration was found, pass settings under the session property`);
  }

  const settings = detoxConfig.session;

  if (!settings.server) {
    throw new Error(`session.server property is missing, should hold the server address`);
  }

  if (!settings.sessionId) {
    throw new Error(`session.sessionId property is missing, should hold the server session id`);
  }
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
