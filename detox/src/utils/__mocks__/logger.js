const METHODS = [
  'trace', 'debug', 'info', 'warn', 'error', 'fatal'
];

class FakeLogger {
  constructor(opts = {}) {
    this.opts = opts;
    this.log = jest.fn();
    this.reinitialize = jest.fn();
    this.level = jest.fn();
    this.getDetoxLevel = this.getDetoxLevel.bind(this);

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

  getDetoxLevel() {
    return this.level();
  }

  clear() {
    this.opts = {};
    return this;
  }
}

module.exports = new FakeLogger();
