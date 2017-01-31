const log = require('npmlog');
const websocket = require('./websocket');
const expect = require('./ios/expect');
const Simulator = require('./devices/simulator');
const argparse = require('./utils/argparse');

const loglevel = argparse.getArgValue('loglevel') ? argparse.getArgValue('loglevel') : 'info';
log.level = loglevel;
log.heading = 'detox';

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

function start(onStart) {
  expect.exportGlobals();
  global.simulator = new Simulator();

  websocket.config(_detoxConfig.session);
  websocket.connect(async() => {
    const target = argparse.getArgValue('target') || 'ios-sim';
    if (target === 'ios-sim') {
      await simulator.prepare(_detoxConfig, onStart);
    } else {
      onStart();
    }
  });
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

module.exports = {
  config,
  start,
  cleanup: websocket.cleanup,
  waitForTestResult: websocket.waitForTestResult,
  openURL
};
