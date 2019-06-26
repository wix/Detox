const _ = require('lodash');
const DetoxRuntimeError = require('../../src/errors/DetoxRuntimeError');

class DetoxJestAdapter /* implements JasmineReporter */ {
  constructor(detox) {
    this.detox = detox;
    this._currentSpec = null;
    this._todos = [];
  }

  async beforeEach() {
    if (!this._currentSpec) {
      throw new DetoxRuntimeError({
        message: 'Detox adapter to Jest is malfunctioning.',
        hint: `Make sure you register it as Jasmine reporter inside init.js:\n` +
              `-------------------------------------------------------------\n` +
              'jasmine.getEnv().addReporter(adapter);',
      });
    }

    await this._flush();
    await this.detox.beforeEach(this._currentSpec);
  }

  async afterAll() {
    await this._flush();
  }

  async _afterEach(previousSpec) {
    await this.detox.afterEach(previousSpec);
  }

  async _flush() {
    const t = this._todos;

    while (t.length > 0) {
      await Promise.resolve().then(t.shift()).catch(()=>{});
    }
  }

  specStarted(result) {
    if (result.pendingReason) {
      return;
    }

    const spec = {
      title: result.description,
      fullName: result.fullName,
      status: 'running',
    };

    this._currentSpec = spec;
  }

  specDone(result) {
    if (result.status === 'disabled' || result.pendingReason) {
      return;
    }

    const spec = {
      title: result.description,
      fullName: result.fullName,
      status: result.status,
      timedOut: this._hasTimedOut(result),
    };

    this._enqueue(() => this._afterEach(spec));
  }

  _hasTimedOut(result) {
    return _.chain(result.failedExpectations)
      .map('error')
      .compact()
      .some(e => _.includes(e.message, 'Timeout'))
      .value();
  }

  _enqueue(fn) {
    this._todos.push(fn);
  }
}

module.exports = DetoxJestAdapter;
