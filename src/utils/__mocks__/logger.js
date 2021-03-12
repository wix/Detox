const METHODS = [
  'trace', 'debug', 'info', 'warn', 'error', 'fatal'
];

class FakeLogger {
  constructor(opts = {}) {
    this.opts = opts;
    this.log = jest.fn();

    for (const method of METHODS) {
      this[method] = jest.fn().mockImplementation((...args) => {
        this.log(method, this.opts, ...args);
      });
    }
  }

  child(opts) {
    this.opts = Object.assign(this.opts, opts);
    return this;
  }

  clear() {
    this.opts = {};
    return this;
  }
}

module.exports = new FakeLogger();
