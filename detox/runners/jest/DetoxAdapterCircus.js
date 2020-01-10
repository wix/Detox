const _ = require('lodash');
const CircusTestEventListenerBase = require('./CircusTestEventListenerBase');

class DetoxAdapterCircus extends CircusTestEventListenerBase {
  constructor(detox) {
    super();

    this._detox = detox;
  }

  static _describeInitError() {
    return {
      message: 'Detox adapter to Jest is malfunctioning.',
      hint: `Make sure you register it as a test-event listener inside init.js:\n` +
        `-------------------------------------------------------------\n` +
        'detoxCircus.getEnv().addEventsListener(adapter);',
      };
  }

  async onTestStart(event) {
    const { test } = event;
    if (test.mode === 'skip' || test.mode === 'todo') {
      return;
    }

    await this._detox.beforeEach({
      title: test.name,
      fullName: this._getFullTestName(test),
      status: 'running',
    });
  }

  async onHookFailure(event) {
    await this._detox.notify({
      event: 'hook_failure',
      hook: event.hook.type,
    });
  }

  async onTestFnFailure(event) {
    await this._detox.notify({
      event: 'test_fn_failure',
    });
  }

  async onTestDone(event, state) {
    const { test } = event;

    await this._detox.afterEach({
      title: test.name,
      fullName: this._getFullTestName(test),
      status: _.isEmpty(test.errors) ? 'passed' : 'failed',
      timedOut: this._hasTimedOut(test)
    });
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
