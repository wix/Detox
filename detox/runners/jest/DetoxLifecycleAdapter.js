const DetoxRuntimeError = require('../../src/errors/DetoxRuntimeError');

class DetoxLifecycleAdapter /* implements JasmineReporter */ {
  constructor(detox) {
    this.detox = detox;
    this._currentSpec = null;
    this._todos = [];
  }

  async beforeAll(config) {
    if (!config) {
      throw new DetoxRuntimeError({
        message: 'Detox adapter to Jest is malfunctioning.',
        hint: 'You must pass specifcy the detox config from your package.json as a parameter to beforeAll()'
      });
    }
    await this.detox.init(config);
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
    await this.detox.cleanup();
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
    };

    this._enqueue(() => this._afterEach(spec));
  }

  _enqueue(fn) {
    this._todos.push(fn);
  }
}

module.exports = DetoxLifecycleAdapter;
