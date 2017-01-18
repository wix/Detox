var websocket = require('./websocket');
var expect = require('./ios/expect');
var Simulator = require('./devices/simulator');
var utils = require('./utils.js');
require('./logger');

var _detoxConfig = {
  session: {
    server: 'ws://localhost:8099',
    sessionId: 'example'
  }
};

function _config(detoxConfig) {
  _detoxConfig = detoxConfig;
}

function _start(onStart) {
  expect.exportGlobals();
  global.simulator = new Simulator();

  websocket.config(_detoxConfig.session);
  websocket.connect(() => {
    const target = utils.getArgValue('target') || 'ios-sim';
    if(target === 'ios-sim') {
      simulator.prepare(_detoxConfig, onStart);
    }
    else {
      onStart();
    }
  });
}

function openURL(url, onComplete) {
  const target = utils.getArgValue('target') || 'ios-sim';
  if(target === 'ios-sim') {
    simulator.openURL(url, onComplete);
  }
  else {
    onComplete();
  }
}

module.exports = {
  config: _config,
  start: _start,
  cleanup: websocket.cleanup,
  waitForTestResult: websocket.waitForTestResult,
  openURL: openURL
};
