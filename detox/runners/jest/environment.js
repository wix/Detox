const NodeEnvironment = require('jest-environment-node'); // eslint-disable-line node/no-extraneous-require
const {getFullTestName, hasTimedOut} = require('./utils');
const timely = require('../../src/utils/timely');

function getTimeoutReason(ms) {
  return `Exceeded timeout of ${ms}ms.`;
}

/**
 * @see https://www.npmjs.com/package/jest-circus#overview
 */
class DetoxEnvironment extends NodeEnvironment {
  constructor(config) {
    super(config);

    this._initTimeout = this.constructor.initTimeout;
    this._testTimeout = this.constructor.initTimeout;
  }

  async setup() {
    await super.setup();

    this.detox = require('../../src')._setGlobal(this.global);
    await timely(() => this.initDetox(), this._initTimeout, getTimeoutReason(this._initTimeout))();
    this._expect = this.global.expect;
  }

  async teardown() {
    await timely(() => this.cleanupDetox(), this._testTimeout, getTimeoutReason(this._testTimeout))();
    await super.teardown();
  }

  async handleTestEvent(event, state) {
    this._testTimeout = state.testTimeout;

    switch (event.name) {
      case 'setup': return this._onSetup(event, state);
      case 'suite_start': return this._onSuiteStart(event, state);
      case 'suite_end': return this._onSuiteEnd(event, state);
      case 'test_start': return this._onTestStart(event, state);
      case 'test_done': return this._onTestDone(event, state);
      case 'teardown': return this._onTeardown(event, state);
    }
  }

  _onSetup(event, state) {
    if (this._expect) {
      this.global.expect = this._expect;
      delete this._expect;
    }
  }

  async _onSuiteStart({describeBlock: {name, tests}}, state) {
    if (tests.length) {
      await this.detox.suiteStart({ name });
    }
  }

  async _onSuiteEnd({describeBlock: {name, tests}}, state) {
    if (tests.length) {
      await this.detox.suiteEnd({ name });
    }
  }

  async _onTestStart(event) {
    const { test } = event;
    if (test.mode === 'skip' || test.mode === 'todo' || test.errors.length > 0) {
      return;
    }

    await this.detox.beforeEach({
      title: test.name,
      fullName: getFullTestName(test),
      status: 'running',
    });
  }

  async _onTestDone(event) {
    const { test } = event;

    await this.detox.afterEach({
      title: test.name,
      fullName: getFullTestName(test),
      status: test.errors.length ? 'failed' : 'passed',
      timedOut: hasTimedOut(test)
    });
  }

  async _onTeardown(event) {
  }

  /** @protected */
  async initDetox() {
    await this.detox.init();
  }

  /** @protected */
  async cleanupDetox() {
    await this.detox.cleanup();
  }
}

DetoxEnvironment.initTimeout = 300000;

module.exports = DetoxEnvironment;
