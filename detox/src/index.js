var websocket = require('./websocket');

module.exports = {
  config: websocket.config,
  connect: websocket.connect,
  cleanup: websocket.cleanup,
  waitForTestResult: websocket.waitForTestResult,
  ios: {
    expect: require('./ios/expect'),
    simulator: require('./ios/simulator')
  }
};
