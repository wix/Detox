const Invoke = require('./invoke/Invoke');
const EarlGrey = require('./invoke/EarlGrey');
const IOS = require('./invoke/IOS');

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
  IOS,
  call: Invoke.call
};
