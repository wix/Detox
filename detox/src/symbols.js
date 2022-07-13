/**
 * @type {{
 *   readonly cleanup: unique symbol;
 *   readonly config: unique symbol;
 *   readonly init: unique symbol;
 *   readonly onHookFailure: unique symbol;
 *   readonly onHookStart: unique symbol;
 *   readonly onHookSuccess: unique symbol;
 *   readonly onRunDescribeFinish: unique symbol;
 *   readonly onRunDescribeStart: unique symbol;
 *   readonly onRunFinish: unique symbol;
 *   readonly onRunStart: unique symbol;
 *   readonly onTestDone: unique symbol;
 *   readonly onTestFnFailure: unique symbol;
 *   readonly onTestFnStart: unique symbol;
 *   readonly onTestFnSuccess: unique symbol;
 *   readonly onTestStart: unique symbol;
 *   readonly primary: unique symbol;
 *   readonly reportFailedTests: unique symbol;
 *   readonly resolveConfig: unique symbol;
 *   readonly secondary: unique symbol;
 *   readonly session: unique symbol;
 *   readonly worker: unique symbol;
 * }}
 */
module.exports = {
  //#region Lifecycle
  onRunStart: Symbol('run_start'),
  onRunDescribeStart: Symbol('run_describe_start'),
  onTestStart: Symbol('test_start'),
  onHookStart: Symbol('hook_start'),
  onHookFailure: Symbol('hook_failure'),
  onHookSuccess: Symbol('hook_success'),
  onTestFnStart: Symbol('test_fn_start'),
  onTestFnFailure: Symbol('test_fn_failure'),
  onTestFnSuccess: Symbol('test_fn_success'),
  onTestDone: Symbol('test_done'),
  onRunDescribeFinish: Symbol('run_describe_finish'),
  onRunFinish: Symbol('run_finish'),
  //#endregion

  //#region IPC
  reportFailedTests: Symbol('reportFailedTests'),
  //#endregion

  //#region Main
  init: Symbol('init'),
  cleanup: Symbol('cleanup'),
  config: Symbol('config'),
  resolveConfig: Symbol('resolveConfig'),
  session: Symbol('session'),
  worker: Symbol('worker'),
  //#endregion

  //#region Realms
  primary: Symbol('primary'),
  secondary: Symbol('secondary'),
  //#endregion
};
