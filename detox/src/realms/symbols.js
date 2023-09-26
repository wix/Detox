/**
 * @type {{
 *   readonly cleanup: unique symbol;
 *   readonly config: unique symbol;
 *   readonly getStatus: unique symbol;
 *   readonly init: unique symbol;
 *   readonly installWorker: unique symbol;
 *   readonly allocateDevice: unique symbol;
 *   readonly deallocateDevice: unique symbol;
 *   readonly logger: unique symbol;
 *   readonly onHookFailure: unique symbol;
 *   readonly onRunDescribeFinish: unique symbol;
 *   readonly onRunDescribeStart: unique symbol;
 *   readonly onTestDone: unique symbol;
 *   readonly onTestFnFailure: unique symbol;
 *   readonly onTestStart: unique symbol;
 *   readonly conductEarlyTeardown: unique symbol;
 *   readonly reportTestResults: unique symbol;
 *   readonly resolveConfig: unique symbol;
 *   readonly session: unique symbol;
 *   readonly tracing: unique symbol;
 *   readonly uninstallWorker: unique symbol;
 *   readonly worker: unique symbol;
 * }}
 */
module.exports = {
  //#region Lifecycle
  onRunDescribeStart: Symbol('run_describe_start'),
  onTestStart: Symbol('test_start'),
  onHookFailure: Symbol('hook_failure'),
  onTestFnFailure: Symbol('test_fn_failure'),
  onTestDone: Symbol('test_done'),
  onRunDescribeFinish: Symbol('run_describe_finish'),
  //#endregion

  //#region IPC
  reportTestResults: Symbol('reportTestResults'),
  conductEarlyTeardown: Symbol('conductEarlyTeardown'),
  allocateDevice: Symbol('allocateDevice'),
  deallocateDevice: Symbol('deallocateDevice'),
  //#endregion

  //#region Main
  cleanup: Symbol('cleanup'),
  config: Symbol('config'),
  getStatus: Symbol('getStatus'),
  init: Symbol('init'),
  installWorker: Symbol('installWorker'),
  logger: Symbol('logger'),
  resolveConfig: Symbol('resolveConfig'),
  session: Symbol('session'),
  tracing: Symbol('tracing'),
  uninstallWorker: Symbol('uninstallWorker'),
  worker: Symbol('worker'),
  //#endregion
};
