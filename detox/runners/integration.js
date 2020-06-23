module.exports = {
  lifecycle: {
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
  },
};
