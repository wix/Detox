const _ = require('lodash');
const {getFullTestName, hasTimedOut} = require('../../jest/utils');

class DetoxCoreListener {
  constructor({ detox }) {
    this._startedTests = new WeakSet();
    this.detox = detox || {
      suiteStart: _.noop,
      suiteEnd: _.noop,
      beforeEach: _.noop,
      afterEach: _.noop,
    };
  }

  async run_describe_start({describeBlock: {name, children}}) {
    if (children.length) {
      await this.detox.suiteStart({ name });
    }
  }

  async run_describe_finish({describeBlock: {name, children}}) {
    if (children.length) {
      await this.detox.suiteEnd({ name });
    }
  }

  async hook_start({ test }) {
    await this._onBeforeActualTestStart(test);
  }

  async test_fn_start({ test }) {
    await this._onBeforeActualTestStart(test);
  }

  async _onBeforeActualTestStart(test) {
    if (!test || this._startedTests.has(test)) {
      return;
    }

    this._startedTests.add(test);

    await this.detox.beforeEach({
      title: test.name,
      fullName: getFullTestName(test),
      status: 'running',
    });
  }

  async test_done({ test }) {
    await this.detox.afterEach({
      title: test.name,
      fullName: getFullTestName(test),
      status: test.errors.length ? 'failed' : 'passed',
      timedOut: hasTimedOut(test)
    });
  }
}

module.exports = DetoxCoreListener;
