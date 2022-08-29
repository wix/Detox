const DetoxLogger = jest.requireActual('../DetoxLogger');

const METHODS = [
  'trace', 'debug', 'info', 'warn', 'error', 'fatal'
];

class FakeLogger {
  static instances = [];
  static defaultOptions = DetoxLogger.defaultOptions;
  static castLevel = DetoxLogger.castLevel;

  fatal;
  error;
  info;
  warn;
  debug;
  trace;

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
      this[method].begin = jest.fn((...args) => {
        this.log('begin', method, this.opts, ...args);
      });
      this[method].complete = jest.fn((...args) => {
        const [action] = args.slice(-1);
        this.log('begin', method, this.opts, ...args);
        try {
          return (typeof action === 'function' ? action() : action);
        } finally {
          this.log('end', method, this.opts, ...args);
        }
      });
      this[method].end = jest.fn((...args) => {
        this.log('end', method, this.opts, ...args);
      });
    }
  }

  get config() {
    return {};
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
