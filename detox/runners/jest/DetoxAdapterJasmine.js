const _ = require('lodash');
const DetoxAdapter = require('./DetoxAdapterImpl');
const log = require('../../src/utils/logger').child({ __filename });

class DetoxAdapterJasmine /* extends JasmineReporter */ {
  constructor(detox) {
    this._adapter = new DetoxAdapter(detox, DetoxAdapterJasmine._describeInitError);
    this._printDeprecationWarning = _.once(() => {
      log.warn(
        '"jest-jasmine2" support is going to be dropped soon.\n' +
        'Please follow the migration guide: https://github.com/wix/Detox/blob/master/docs/Guide.Migration.md#1630');
    });
  }

  static _describeInitError() {
    return {
      message: 'Detox adapter to Jest is malfunctioning.',
      hint: `Make sure you register it as Jasmine reporter inside init.js:\n` +
        `-------------------------------------------------------------\n` +
        'jasmine.getEnv().addReporter(adapter);',
    };
  }

  async beforeEach() {
    this._printDeprecationWarning();
    await this._adapter.beforeEach();
  }

  async afterAll() {
    await this._adapter.afterAll();
  }

  async suiteStarted(result) {
    await this._adapter.suiteStart({name: result.description});
  }

  async suiteDone(result) {
    await this._adapter.suiteEnd({name: result.description});
  }

  specStarted(result) {
    if (result.pendingReason) {
      return;
    }

    this._adapter.testStart({
      title: result.description,
      fullName: result.fullName,
      status: 'running',
    });
  }

  specDone(result) {
    if (result.status === 'disabled' || result.pendingReason) {
      return;
    }

    this._adapter.testComplete({
      status: result.status,
      timedOut: this._hasTimedOut(result),
    });
  }

  _hasTimedOut(result) {
    return _.chain(result.failedExpectations)
      .map('error')
      .compact()
      .some(e => _.includes(e.message, 'Timeout'))
      .value();
  }
}

module.exports = DetoxAdapterJasmine;
