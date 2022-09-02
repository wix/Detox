const funpermaproxy = require('funpermaproxy');

const symbols = require('../symbols');

class DetoxInternalsFacade {
  /**
   * @param context
   */
  constructor(context) {
    this.config = context[symbols.config];
    this.getStatus = context[symbols.getStatus];
    this.init = context[symbols.init];
    this.cleanup = context[symbols.cleanup];
    this.log = context[symbols.logger];
    this.installWorker = context[symbols.installWorker];
    this.uninstallWorker = context[symbols.uninstallWorker];
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
    this.trace = context.trace;
    this.worker = funpermaproxy(() => context[symbols.worker]);
  }
}

module.exports = DetoxInternalsFacade;
