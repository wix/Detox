const {getFullTestName, hasTimedOut} = require('../utils');

class DetoxCoreListener {
  constructor({ detox }) {
    this.detox = detox;
    this.startedTests = new WeakSet();
  }

  async suite_start({describeBlock: {name, tests}}) {
    if (tests.length) {
      await this.detox.suiteStart({ name });
    }
  }

  async hook_start({ test }) {
    await this._onBeforeActualTestStart(test);
  }

  async test_fn_start({ test }) {
    await this._onBeforeActualTestStart(test);
  }

  async test_done({ test }) {
    await this.detox.afterEach({
      title: test.name,
      fullName: getFullTestName(test),
      status: test.errors.length ? 'failed' : 'passed',
      timedOut: hasTimedOut(test)
    });
  }

  async suite_end({describeBlock: {name, tests}}, state) {
    if (tests.length) {
      await this.detox.suiteEnd({ name });
    }
  }

  async _onBeforeActualTestStart(test) {
    if (!test || this.startedTests.has(test)) {
      return;
    }

    this.startedTests.add(test);
    await this.detox.beforeEach({
      title: test.name,
      fullName: getFullTestName(test),
      status: 'running',
    });
  }
}

module.exports = DetoxCoreListener;
