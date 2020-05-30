const {getFullTestName, hasTimedOut} = require('../utils');

class DetoxCoreListener {
  constructor({ detox }) {
    this.detox = detox;
  }

  async suite_start({describeBlock: {name, tests}}) {
    if (tests.length) {
      await this.detox.suiteStart({ name });
    }
  }

  async test_start({ test }) {
    if (test.mode === 'skip' || test.mode === 'todo' || test.errors.length > 0) {
      return;
    }

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

  async suite_end({describeBlock: {name, tests}}, state) {
    if (tests.length) {
      await this.detox.suiteEnd({ name });
    }
  }
}

module.exports = DetoxCoreListener;
