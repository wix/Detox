const DetoxLogger = jest.requireActual('../DetoxLogger');

const METHODS = [
  'trace', 'debug', 'info', 'warn', 'error', 'fatal'
];

class FakeLogger {
  static instances = [];
  static defaultOptions = DetoxLogger.defaultOptions;
  static castLevel = DetoxLogger.castLevel;

  constructor(opts = {}) {
    FakeLogger.instances.push(this);

    this.opts = opts;
    this.log = jest.fn();
    this._level = jest.fn();
    Object.defineProperty(this, 'level', {
      get: () => this._level(),
    });

    for (const method of METHODS) {
      this[method] = jest.fn((...args) => {
        this.log(method, this.opts, ...args);
      });
    }
  }

  setConfig() {}

  child(opts) {
    this.opts = Object.assign(this.opts, opts);
    return this;
  }

  clear() {
    this.opts = {};
    return this;
  }
}

module.exports = FakeLogger;
