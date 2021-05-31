const _ = require('lodash');

const {
  onRunDescribeStart,
  onTestStart,
  onHookFailure,
  onTestFnFailure,
  onTestDone,
  onRunDescribeFinish,
} = require('../../integration').lifecycle;
const { getFullTestName, hasTimedOut } = require('../../jest/utils');

const RETRY_TIMES = Symbol.for('RETRY_TIMES');

class DetoxCoreListener {
  constructor({ detox, env }) {
    this._startedTests = new WeakSet();
    this._testsFailedBeforeStart = new WeakSet();
    this._env = env;
    this._testRunTimes = 1;
    this.detox = detox;
  }

  _getTestInvocations(test) {
    const { DETOX_RERUN_INDEX } = process.env;

    if (!isNaN(DETOX_RERUN_INDEX)) {
      return Number(DETOX_RERUN_INDEX) * this._testRunTimes + test.invocations;
    } else {
      return test.invocations;
    }
  }

  async run_describe_start({ describeBlock: { name, children } }) {
    if (children.length) {
      await this.detox[onRunDescribeStart]({ name });
    }
  }

  async run_describe_finish({ describeBlock: { name, children } }) {
    if (children.length) {
      await this.detox[onRunDescribeFinish]({ name });
    }
  }

  async test_start({ test }) {
    if (!_.isEmpty(test.errors)) {
      this._testsFailedBeforeStart.add(test);
    }

    const circusRetryTimes = +this._env.global[RETRY_TIMES];
    this._testRunTimes = isNaN(circusRetryTimes) ? 1 : 1 + circusRetryTimes;
  }

  async hook_start(_event, state) {
    await this._onBeforeActualTestStart(state.currentlyRunningTest);
  }

  async hook_failure({ error, hook }) {
    await this.detox[onHookFailure]({
      error,
      hook: hook.type,
    });
  }

  async test_fn_start({ test }) {
    await this._onBeforeActualTestStart(test);
  }

  async test_fn_failure({ error }) {
    await this.detox[onTestFnFailure]({ error });
  }

  async _onBeforeActualTestStart(test) {
    if (!test || test.status === 'skip' || this._startedTests.has(test) || this._testsFailedBeforeStart.has(test)) {
      return;
    }

    this._startedTests.add(test);

    await this.detox[onTestStart]({
      title: test.name,
      fullName: getFullTestName(test),
      status: 'running',
      invocations: this._getTestInvocations(test),
    });
  }

  async test_done({ test }) {
    if (this._startedTests.has(test)) {
      await this.detox[onTestDone]({
        title: test.name,
        fullName: getFullTestName(test),
        status: test.errors.length ? 'failed' : 'passed',
        invocations: this._getTestInvocations(test),
        timedOut: hasTimedOut(test)
      });

      this._startedTests.delete(test);
    }
  }
}

module.exports = DetoxCoreListener;
