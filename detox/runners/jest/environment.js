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

    this._initTimeout = 300000;
    this._testTimeout = 5000;
  }

  setInitTimeout(ms) {
    this._initTimeout = ms;
  }

  async setup() {
    await super.setup();

    this.detox = require('../../src')._setGlobal(this.global);
    await timely(() => this.initDetox(), this._initTimeout, getTimeoutReason(this._initTimeout))();
  }

  async teardown() {
    await timely(() => this.cleanupDetox(), this._testTimeout, getTimeoutReason(this._testTimeout))();
    await super.teardown();
  }

  /** @protected */
  async initDetox() {
    const config = require(path.join(process.cwd(), 'package.json')).detox;
    await this.detox.init(config);
  }

  /** @protected */
  async cleanupDetox() {
    await this.detox.cleanup();
  }

  async handleTestEvent(event, state) {
    switch (event.name) {
      case 'setup': return this._onSetup(event, state);
      case 'suite_start': return this._onSuiteStart(event, state);
      case 'suite_end': return this._onSuiteEnd(event, state);
      case 'test_start': return this._onTestStart(event, state);
      case 'test_done': return this._onTestDone(event, state);
    }
  }

  async _onSetup(event, state) {
    this._testTimeout = state.testTimeout; // TODO: check this
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
}

module.exports = DetoxEnvironment;
