// @ts-nocheck
const _ = require('lodash');

const detox = require('detox/internals');
const { getFullTestName, hasTimedOut } = require('../utils');

const RETRY_TIMES = Symbol.for('RETRY_TIMES');

const log = detox.log.child({ cat: 'lifecycle,jest-environment' });

class DetoxCoreListener {
  constructor({ env }) {
    this._startedTests = new Set();
    this._skippedTests = new Set();
    this._testsFailedBeforeStart = new Set();
    this._env = env;
    this._circusRetryTimes = 1;
  }

  async setup() {
    // Workaround to override Jest's expect
    if (detox.config.behavior.init.exposeGlobals) {
      const g = this._env.global;

      g.by = g.detox.by;
      g.element = g.detox.element;
      g.expect = g.detox.expect;
      g.waitFor = g.detox.waitFor;
      g.detox.log = detox.log;
    }
  }

  async run_describe_start({ describeBlock }) {
    if (describeBlock.children.length) {
      log.trace.begin(describeBlock.parent ? describeBlock.name : 'run the tests');
    }
  }

  async run_describe_finish({ describeBlock }) {
    if (describeBlock.children.length) {
      log.trace.end();
    }
  }

  async test_start({ test }) {
    const metadata = this._getTestMetadata(test);
    if (metadata.status === 'failed') {
      this._testsFailedBeforeStart.add(test);
    }

    log.trace.begin({
      context: 'test',
      status: metadata.status,
      fullName: metadata.fullName,
      invocations: metadata.invocations,
    }, metadata.title);

    const circusRetryTimes = +this._env.global[RETRY_TIMES];
    this._circusRetryTimes = isNaN(circusRetryTimes) ? 1 : 1 + circusRetryTimes;
  }

  async test_skip({ test }) {
    log.trace.end({ status: 'skip' }, getFullTestName(test));
    this._skippedTests.add(test);
  }

  async test_todo({ test }) {
    log.trace.end({ status: 'todo' }, getFullTestName(test));
    this._skippedTests.add(test);
  }

  async hook_start(event, state) {
    await this._onBeforeActualTestStart(state.currentlyRunningTest);
    log.trace.begin({ functionCode: event.hook.fn.toString() }, event.hook.type);
  }

  async hook_success() {
    log.trace.end({ success: true });
  }

  async hook_failure({ error, hook }) {
    log.trace.end({ success: false, error });
  }

  async test_fn_start({ test }) {
    await this._onBeforeActualTestStart(test);

    if (!this._testsFailedBeforeStart.has(test)) {
      // Jest bug workaround: beforeAll hook errors result into an unterminated test_fn_start event.
      log.trace.begin({ functionCode: test.fn.toString() }, 'test_fn');
    }
  }

  async test_fn_success() {
    log.trace.end({ success: true });
  }

  async test_fn_failure({ error }) {
    log.trace.end({ success: false, error });
  }

  async test_done({ test }) {
    const metadata = this._getTestMetadata(test);

    if (this._startedTests.has(test)) {
      this._startedTests.delete(test);
    }

    log.trace.end(_.pick(metadata, ['status', 'timedOut']));
  }

  async _onBeforeActualTestStart(test) {
    if (!this._isTestActuallyStarting(test)) {
      return;
    }

    this._startedTests.add(test);
  }

  _isTestActuallyStarting(test) {
    return test && !this._isTestSkipped(test) && !this._startedTests.has(test) && !this._testsFailedBeforeStart.has(test);
  }

  _isTestSkipped(test) {
    return test && this._skippedTests.has(test);
  }

  _getTestMetadata(test) {
    const result = {
      title: test.name,
      fullName: getFullTestName(test),
      status: this._getTestStatus(test),
      invocations: this._getTestInvocations(test),
    };

    if (result.status === 'failed') {
      result.timedOut = hasTimedOut(test);
    }

    return result;
  }

  /** @returns { 'failed' | 'passed' | 'running'} */
  _getTestStatus(test) {
    if (!_.isEmpty(test.errors)) {
      return 'failed';
    }

    if (test.status === 'done') {
      return 'passed';
    } else {
      return test.status || 'running';
    }
  }

  _getTestInvocations(test) {
    const { testSessionIndex } = detox.session;
    return testSessionIndex * this._circusRetryTimes + test.invocations;
  }
}

module.exports = DetoxCoreListener;
