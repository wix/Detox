const DetoxAdapter = require('./DetoxAdapterImpl');
const { getFullTestName, hasTimedOut } = require('./utils');

class DetoxAdapterCircus {
  constructor(detox) {
    this._adapter = new DetoxAdapter(detox, DetoxAdapterCircus._describeInitError);
  }

  static _describeInitError() {
    return {
      message: 'Detox adapter to Jest is malfunctioning.',
      hint: `Make sure you register it as a test-event listener inside init.js:\n` +
        `-------------------------------------------------------------\n` +
        'detoxCircus.getEnv().addEventsListener(adapter);',
      };
  }

  async beforeEach() {
    await this._adapter.beforeEach();
  }

  async afterAll() {
    await this._adapter.afterAll();
  }

  async run_describe_start({ describeBlock: { name, children } }, state) { // eslint-disable-line no-unused-vars
    if (children.length) await this._adapter.suiteStart({ name });
  }

  async run_describe_finish({ describeBlock: { name, children } }, state) { // eslint-disable-line no-unused-vars
    if (children.length) await this._adapter.suiteEnd({ name });
  }

  test_start(event) {
    const { test } = event;
    if (test.mode === 'skip' || test.mode === 'todo' || test.errors.length > 0) {
      return;
    }

    this._adapter.testStart({
      title: test.name,
      fullName: getFullTestName(test),
      status: 'running',
    });
  }

  test_done(event) {
    const { test } = event;
    this._adapter.testComplete({
      status: test.errors.length ? 'failed' : 'passed',
      timedOut: hasTimedOut(test)
    });
  }

  test_skip(event) { // eslint-disable-line no-unused-vars
    // Ignored (for clarity)
  }
}

module.exports = DetoxAdapterCircus;
