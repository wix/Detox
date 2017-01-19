const log = require('npmlog');
const websocket = require('./websocket');
const expect = require('./ios/expect');
const Simulator = require('./devices/simulator');
const argparse = require('./utils/argparse');

const loglevel = argparse.getArgValue('verbose') ? 'verbose' : 'info';
log.level = loglevel;
log.heading = "detox";

let _detoxConfig = {
  session: {
    server: 'ws://localhost:8099',
    sessionId: 'example'
  }
};

function _config(detoxConfig) {
  _detoxConfig = detoxConfig;
}

async function _start(onStart) {
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

module.exports = {
  config: _config,
  start: _start,
  cleanup: websocket.cleanup,
  waitForTestResult: websocket.waitForTestResult,
  openURL: openURL
};
