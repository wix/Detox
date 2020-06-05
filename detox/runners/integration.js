/* TODO: consider implementing:
 * run_start
 * hook_start
 * hook_success
 * test_fn_start
 * test_fn_success
 * run_finish
 */

module.exports = {
  symbols: {
    onRunDescribeStart: Symbol('run_describe_start'),
    onTestStart: Symbol('test_start'),
    onHookFailure: Symbol('hook_failure'),
    onTestFnFailure: Symbol('test_fn_failure'),
    onTestDone: Symbol('test_done'),
    onRunDescribeFinish: Symbol('run_describe_finish'),
  },
};
