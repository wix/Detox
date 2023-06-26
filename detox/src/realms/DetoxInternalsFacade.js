const funpermaproxy = require('funpermaproxy');

const symbols = require('./symbols');

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
    this.onRunDescribeFinish = context[symbols.onRunDescribeFinish];
    this.onRunDescribeStart = context[symbols.onRunDescribeStart];
    this.onTestDone = context[symbols.onTestDone];
    this.onTestFnFailure = context[symbols.onTestFnFailure];
    this.onTestStart = context[symbols.onTestStart];
    this.reportTestResults = context[symbols.reportTestResults];
    this.resolveConfig = context[symbols.resolveConfig];
    this.session = context[symbols.session];
    this.tracing = context[symbols.tracing];
    this.unsafe_conductEarlyTeardown = context[symbols.conductEarlyTeardown];
    this.worker = funpermaproxy(() => context[symbols.worker]);
  }
}

module.exports = DetoxInternalsFacade;
