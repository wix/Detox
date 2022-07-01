const DetoxLogger = jest.requireActual('../DetoxLogger');
const DetoxTraceEventBuilder = jest.requireActual('../DetoxTraceEventBuilder');

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
    }

    this._tracer = new DetoxTraceEventBuilder(this.log);
    Object.assign(this.trace, {
      begin: this._tracer.begin.bind(this._tracer),
      instant: this._tracer.instant.bind(this._tracer),
      end: this._tracer.end.bind(this._tracer),
    });
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
