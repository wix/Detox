const Invoke = require('./invoke/Invoke');
const EarlGrey = require('./invoke/EarlGrey');

class InvocationManager {
  constructor(excutionHandler) {
    this.executionHandler = excutionHandler;
  }

  execute(invocation) {
    this.executionHandler.execute(invocation);
  }
}

module.exports = {
  InvocationManager,
  EarlGrey,
  IOS: Invoke.genericInvokeObject,
  call: Invoke.call
};
