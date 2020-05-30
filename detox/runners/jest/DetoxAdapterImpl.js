const DetoxRuntimeError = require('../../src/errors/DetoxRuntimeError');

class DetoxAdapterImpl {
  constructor(detox, describeInitErrorFn) {
    this.detox = detox;
    this._describeInitError = describeInitErrorFn;
    this._currentTest = null;
    this._todos = [];
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

  async suiteStart({name}) {
    this._enqueue(() => this.detox.suiteStart({name}));
  }

  async suiteEnd({name}) {
    this._enqueue(() => this.detox.suiteEnd({name}));
  }

  testStart({title, fullName, status}) {
    this._currentTest = {
      title,
      fullName,
      status,
    };
  }

  testComplete({status, timedOut}) {
    if (this._currentTest) {
      const _test = {
        ...this._currentTest,
        status,
        timedOut,
      };

      this._currentTest = null;
      this._enqueue(() => this._afterEach(_test));
    }
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
