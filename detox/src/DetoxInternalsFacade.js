const funpermaproxy = require('funpermaproxy');

const symbols = require('./symbols');

class DetoxInternalsFacade {
  /**
   * @param context
   */
  constructor(context) {
    this.cleanup = context[symbols.cleanup];
    this.config = context[symbols.config];
    this.init = context[symbols.init];
    this.log = context.log;
    this.onHookFailure = context[symbols.onHookFailure];
    this.onHookStart = context[symbols.onHookStart];
    this.onHookSuccess = context[symbols.onHookSuccess];
    this.onRunDescribeFinish = context[symbols.onRunDescribeFinish];
    this.onRunDescribeStart = context[symbols.onRunDescribeStart];
    this.onRunFinish = context[symbols.onRunFinish];
    this.onRunStart = context[symbols.onRunStart];
    this.onTestDone = context[symbols.onTestDone];
    this.onTestFnFailure = context[symbols.onTestFnFailure];
    this.onTestFnStart = context[symbols.onTestFnStart];
    this.onTestFnSuccess = context[symbols.onTestFnSuccess];
    this.onTestStart = context[symbols.onTestStart];
    this.reportFailedTests = context[symbols.reportFailedTests];
    this.resolveConfig = context[symbols.resolveConfig];
    this.session = context[symbols.session];
    this.worker = funpermaproxy(() => context[symbols.worker]);
  }
}

module.exports = DetoxInternalsFacade;
