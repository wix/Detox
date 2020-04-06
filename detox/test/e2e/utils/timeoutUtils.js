const noop = () => {};
const DetoxServer = require('detox/src/server/DetoxServer');

function causeAppNotReady() {
  const originalFn = DetoxServer.prototype.sendAction;

  DetoxServer.prototype.sendAction = function (ws, action) {
    if (action.type !== 'ready') {
      originalFn.call(this, ws, action);
    }
  };
}

const isInTimeoutTest = process.env.TIMEOUT_E2E_TEST === '1';
if (isInTimeoutTest) {
  causeAppNotReady();
}

module.exports = {
  initTimeout: isInTimeoutTest ? 30000 : 300000,
  testTimeout: 120000,
};