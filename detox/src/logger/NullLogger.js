// @ts-ignore
const { red, yellow } = require('chalk');

// TODO: implement it correctly
class NullLogger {
  constructor(config) {
    this._config = config || {};
  }

  child(overrides) {
    return new NullLogger(
      { ...this._config, ...overrides },
    );
  }

  error(meta, msg) {
    msg = typeof meta === 'string' ? meta : msg;
    console.error(red(msg));
  }

  warn(meta, msg) {
    msg = typeof meta === 'string' ? meta : msg;
    console.error(yellow(msg));
  }

  info(meta, msg) {
    msg = typeof meta === 'string' ? meta : msg;
    console.log(msg);
  }

  debug(meta, msg) {
    msg = typeof meta === 'string' ? meta : msg;
    console.log(msg);
  }

  trace(meta, msg) {
    msg = typeof meta === 'string' ? meta : msg;
    console.log(msg);
  }

  get level() {
    return 'trace';
  }
}

module.exports = NullLogger;
