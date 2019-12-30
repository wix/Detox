const DetoxRuntimeError = require('../../src/errors/DetoxRuntimeError');
const AdaptiveTimeouts = require('../../src/runtime/AdaptiveTimeouts');
const adaptiveTimeoutsHolder = require('../../src/runtime/adaptiveTimeoutsHolder');

class DetoxAdapterImpl {
  constructor(detox, describeInitErrorFn) {
    this.detox = detox;
    this._describeInitError = describeInitErrorFn;
    this._currentTest = null;
    this._todos = [];
  }

  setTimeout({testRun, deviceBoot}) {
    jest.setTimeout(testRun);

    adaptiveTimeoutsHolder.instance = new AdaptiveTimeouts({
      baseTimeout: testRun,
      coldBootInc: deviceBoot,
    }, (timeout) => {
      jest.setTimeout(timeout);
    });
  }

  async beforeEach() {
    if (!this._currentTest) {
      throw new DetoxRuntimeError(this._describeInitError());
    }

    await this._flush();
    await this.detox.beforeEach(this._currentTest);
  }

  async afterAll() {
    await this._flush();
  }

  testStart({title, fullName, status}) {
    this._currentTest = {
      title,
      fullName,
      status,
    };
  }

  testComplete({status, timedOut}) {
    const _test = {
      ...this._currentTest,
      status,
      timedOut,
    };
    this._enqueue(() => this._afterEach(_test));
  }

  async _afterEach(previousTest) {
    await this.detox.afterEach(previousTest);
  }

  _enqueue(fn) {
    this._todos.push(fn);
  }

  async _flush() {
    const t = this._todos;

    while (t.length > 0) {
      await Promise.resolve().then(t.shift()).catch(()=>{});
    }
  }
}

module.exports = DetoxAdapterImpl;
