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
    /** @type import('trace-event-lib').DurationEventHandle */
    this._testTraceEvent = null;
  }

  async setup() {
    // Workaround to override Jest's expect
    if (detoxInternals.config.behavior.init.exposeGlobals) {
      this._env.global.expect = detox.expect;
    }
  }

  async run_describe_start({ describeBlock: { name, children } }) {
    if (children.length) {
      this._env.traceEvent.begin({ name });
      await detoxInternals.onRunDescribeStart({ name });
    }
  }

  async run_describe_finish({ describeBlock: { name, children } }) {
    if (children.length) {
      await detoxInternals.onRunDescribeFinish({ name });
      this._env.traceEvent.end();
    }
  }

  async test_start({ test }) {
    if (!_.isEmpty(test.errors)) {
      this._testsFailedBeforeStart.add(test);
    }

    const circusRetryTimes = +this._env.global[RETRY_TIMES];
    this._testRunTimes = isNaN(circusRetryTimes) ? 1 : 1 + circusRetryTimes;
  }

  async hook_start(event, state) {
    await this._onBeforeActualTestStart(state.currentlyRunningTest);

    if (this._testTraceEvent) {
      this._testTraceEvent.begin({
        name: event.hook.type,
        args: {
          functionCode: event.hook.fn.toString()
        },
      });
    }
  }

  async hook_success() {
    if (this._testTraceEvent) {
      this._testTraceEvent.end({
        args: { success: true }
      });
    }
  }

  async hook_failure({ error }) {
    if (this._testTraceEvent) {
      this._testTraceEvent.end({
        args: { success: false, error: error.toString() }
      });
    }
  }

  async test_fn_start({ test }) {
    await this._onBeforeActualTestStart(test);

    if (this._testTraceEvent) {
      this._testTraceEvent.begin({
        name: 'test_fn',
        args: {
          functionCode: test.fn.toString()
        },
      });
    }
  }

  async test_fn_success({ test }) {
    await this._onBeforeActualTestStart(test);

    if (this._testTraceEvent) {
      this._testTraceEvent.end({
        args: { success: true }
      });
    }
  }

  async test_fn_failure({ error }) {
    await detoxInternals.onTestFnFailure({ error });

    if (this._testTraceEvent) {
      this._testTraceEvent.end({
        args: { success: false, error: error.toString() }
      });
    }
  }

  async test_done({ test }) {
    if (this._startedTests.has(test)) {
      const failed = test.errors.length > 0;
      const metadata = {
        ...this._getTestMetadata(test),
        status: failed ? 'failed' : 'passed',
        timedOut: failed ? hasTimedOut(test) : undefined,
      };

      await detoxInternals.onTestDone(metadata);
      this._startedTests.delete(test);
      this._testTraceEvent.end({
        args: {
          status: metadata.status,
          timedOut: metadata.timedOut,
        },
      });
      this._testTraceEvent = null;
    }
  }

  async run_finish(_event, state) {
    const hasFailedTests = this._hasFailedTests(state.rootDescribeBlock);
    if (hasFailedTests) {
      const handledByJestCircus = this._testRunTimes > 1 && !detoxInternals.config.testRunner.jest.retryAfterCircusRetries;
      await detoxInternals.reportFailedTests([this._env.testPath], handledByJestCircus);
    }
  }

  async _onBeforeActualTestStart(test) {
    if (!test || test.status === 'skip' || this._startedTests.has(test) || this._testsFailedBeforeStart.has(test)) {
      return false;
    }

    const metadata = {
      ...this._getTestMetadata(test),
      status: 'running',
    };

    this._startedTests.add(test);
    this._testTraceEvent = this._env.traceEvent.begin({
      name: metadata.title,
      args: {
        context: 'test',
        status: metadata.status,
        fullName: metadata.fullName,
        invocations: metadata.invocations,
      },
    });

    await detoxInternals.onTestStart(metadata);
    return true;
  }

  _getTestInvocations(test) {
    const { testSessionIndex } = detoxInternals.session;
    return testSessionIndex * this._testRunTimes + test.invocations;
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

  _getTestMetadata(test) {
    return {
      title: test.name,
      fullName: getFullTestName(test),
      invocations: this._getTestInvocations(test),
    };
  }
}

module.exports = DetoxCoreListener;
