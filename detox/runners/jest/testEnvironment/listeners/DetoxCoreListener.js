// @ts-nocheck
const _ = require('lodash');

const detox = require('../../../..');
const detoxInternals = require('../../../../internals');
const { getFullTestName, hasTimedOut } = require('../utils');

const RETRY_TIMES = Symbol.for('RETRY_TIMES');

class DetoxCoreListener {
  constructor({ env }) {
    this._startedTests = new WeakSet();
    this._testsFailedBeforeStart = new WeakSet();
    this._env = env;
    this._testRunTimes = 1;
  }

  _getTestInvocations(test) {
    const { DETOX_RERUN_INDEX } = process.env;

    if (!isNaN(DETOX_RERUN_INDEX)) {
      return Number(DETOX_RERUN_INDEX) * this._testRunTimes + test.invocations;
    } else {
      return test.invocations;
    }
  }

  async setup() {
    // Workaround to override Jest's expect
    if (detoxInternals.config.behaviorConfig.init.exposeGlobals) {
      this._env.global.expect = detox.expect;
    }
  }

  async run_describe_start({ describeBlock: { name, children } }) {
    if (children.length) {
      await detoxInternals.onRunDescribeStart({ name });
    }
  }

  async run_describe_finish({ describeBlock: { name, children } }) {
    if (children.length) {
      await detoxInternals.onRunDescribeFinish({ name });
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
    await detoxInternals.onHookFailure({
      error,
      hook: hook.type,
    });
  }

  async test_fn_start({ test }) {
    await this._onBeforeActualTestStart(test);
  }

  async test_fn_failure({ error }) {
    await detoxInternals.onTestFnFailure({ error });
  }

  async _onBeforeActualTestStart(test) {
    if (!test || test.status === 'skip' || this._startedTests.has(test) || this._testsFailedBeforeStart.has(test)) {
      return;
    }

    this._startedTests.add(test);

    await detoxInternals.onTestStart({
      title: test.name,
      fullName: getFullTestName(test),
      status: 'running',
      invocations: this._getTestInvocations(test),
    });
  }

  async test_done({ test }) {
    if (this._startedTests.has(test)) {
      await detoxInternals.onTestDone({
        title: test.name,
        fullName: getFullTestName(test),
        status: test.errors.length ? 'failed' : 'passed',
        invocations: this._getTestInvocations(test),
        timedOut: hasTimedOut(test)
      });

      this._startedTests.delete(test);
    }
  }

  async run_finish(_event, state) {
    if (this._hasFailedTests(state.rootDescribeBlock)) {
      await detoxInternals.reportFailedTests([this._env.testPath]);
    }
  }

  _hasFailedTests(block) {
    if (block.children) {
      for (const child of block.children) {
        if (this._hasFailedTests(child)) {
          return true;
        }
      }
    }

    return block.errors ? block.errors.length > 0 : false;
  }
}

module.exports = DetoxCoreListener;
