const uiDevice = require('./UIDevice');
const uiAutomaton = require('./UIAutomator');
const invoke = require('../../invoke');

class UiDeviceProxy {

  constructor(invocationManager) {
    this.invocationManager = invocationManager;
    this.getUIDevice = this.getUIDevice.bind(this);
  }

  getUIDevice() {
   return new Proxy(uiDevice, {
      get: (target, prop) => {
        if (target[prop] !== undefined) {
          return async (...params) => {
            const call = target[prop](invoke.callDirectly(uiAutomaton.uiDevice()), ...params);
            const invokeResult = await this.invocationManager.execute(call);
            if (invokeResult && invokeResult.params && invokeResult.params.result) {
                return invokeResult.params.result;
            }
          }
        }
      }
    });
  }
}

module.exports = UiDeviceProxy;
