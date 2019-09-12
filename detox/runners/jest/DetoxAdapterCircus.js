const _ = require('lodash');
const { TestEventListenerBase } = require('./CircusTestEventListeners');
const DetoxAdapter = require('./DetoxAdapterImpl');

class DetoxAdapterCircus extends TestEventListenerBase {
  constructor(detox) {
    super();
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

  _onTestStart(event) {
    const { test } = event;
    if (test.mode === 'skip' || test.mode === 'todo') {
      return;
    }

    this._adapter.testStart({
      title: test.name,
      fullName: this._getFullTestName(test),
      status: 'running',
    });
  }

  _onTestComplete(event) {
    const { test } = event;
    this._adapter.testComplete({
      status: test.errors.length ? 'failed' : 'passed',
      timedOut: this._hasTimedOut(test)
    });
  }

  _onTestSkip(event) {
    // Ignored (for clarity)
  }

  _getFullTestName(test, separator = ' ') {
    let testName = '';
    for (let parent = test.parent;
         parent.parent; // Since there's always an unwanted root made up by jest
         parent = parent.parent) {
      testName = parent.name + separator + testName;
    }
    testName += test.name;
    return testName;
  }

  _hasTimedOut(test) {
    const { errors } = test;
    const errorsArray = (_.isArray(errors) ? errors : [errors]);
    const timedOut = _.chain(errorsArray)
      .flattenDeep()
      .filter(_.isObject)
      .some(e => _.includes(e.message, 'Exceeded timeout'))
      .value();
    return timedOut;
  }
}

module.exports = DetoxAdapterCircus;
