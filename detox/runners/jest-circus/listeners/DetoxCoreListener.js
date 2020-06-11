const _ = require('lodash');
const {getFullTestName, hasTimedOut} = require('../../jest/utils');
const {
  onRunDescribeStart,
  onTestStart,
  onHookFailure,
  onTestFnFailure,
  onTestDone,
  onRunDescribeFinish,
} = require('../../integration').lifecycle;

class DetoxCoreListener {
  constructor({ detox }) {
    this._startedTests = new WeakSet();
    this._testsFailedBeforeStart = new WeakSet();
    this.detox = detox;
  }

  async run_describe_start({describeBlock: {name, children}}) {
    if (children.length) {
      await this.detox[onRunDescribeStart]({ name });
    }
  }

  async run_describe_finish({describeBlock: {name, children}}) {
    if (children.length) {
      await this.detox[onRunDescribeFinish]({ name });
    }
  }

  async test_start({ test }) {
    if (!_.isEmpty(test.errors)) {
      this._testsFailedBeforeStart.add(test);
    }
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
    });
  }

  async test_done({ test }) {
    if (this._startedTests.has(test)) {
      await this.detox[onTestDone]({
        title: test.name,
        fullName: getFullTestName(test),
        status: test.errors.length ? 'failed' : 'passed',
        timedOut: hasTimedOut(test)
      });
    }
  }
}

module.exports = DetoxCoreListener;
