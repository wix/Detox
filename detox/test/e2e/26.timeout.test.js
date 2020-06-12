const DetoxServer = require('detox/src/server/DetoxServer');

function causeAppNotReady() {
  const originalFn = DetoxServer.prototype.sendAction;

  DetoxServer.prototype.sendAction = function (ws, action) {
    if (action.type !== 'ready') {
      originalFn.call(this, ws, action);
    }
  };
}

if (process.env.TIMEOUT_E2E_TEST === '1') {
  if (typeof jasmine !== 'undefined') {
    causeAppNotReady();
  }

  it('timeout test', () => {});
} else {
  it('empty test', () => {});
}
