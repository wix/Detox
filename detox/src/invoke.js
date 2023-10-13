const Espresso = require('./invoke/Espresso');
const EspressoWeb = require('./invoke/EspressoWeb');
const Invoke = require('./invoke/Invoke');

class InvocationManager {
  constructor(excutionHandler) {
    this.executionHandler = excutionHandler;
  }

  async execute(invocation) {
   return await this.executionHandler.execute(invocation);
  }
}

module.exports = {
  InvocationManager,
  Espresso: Espresso.target,
  EspressoWeb: EspressoWeb.target,
  IOS: Invoke.genericInvokeObject,
  Android: Invoke.genericInvokeObject,
  call: Invoke.call,
  callDirectly: Invoke.callDirectly
};
