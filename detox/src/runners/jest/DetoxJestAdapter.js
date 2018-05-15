class DetoxJestAdapter /* implements JasmineReporter */ {
  constructor(detox) {
    this.detox = detox;
    this._currentSpec = null;
    this._todos = [];
    this.timeout = 30000;
  }

  async beforeEach() {
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

    const spec = Object.freeze({
      title: result.description,
      fullName: result.fullName,
      status: 'running',
    });

    this._currentSpec = spec;
  }

  specDone(result) {
    if (result.status === 'disabled' || result.pendingReason) {
      return;
    }

    const spec = Object.freeze({
      title: result.description,
      fullName: result.fullName,
      status: result.status,
    });

    this._enqueue(() => this._afterEach(spec));
  }

  _enqueue(fn) {
    this._todos.push(fn);
  }
}

module.exports = DetoxJestAdapter;
