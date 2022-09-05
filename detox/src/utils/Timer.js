// @ts-nocheck
const DetoxRuntimeError = require('../errors/DetoxRuntimeError');

const Deferred = require('./Deferred');

class Timer {
  /**
   * @param {string} description - gives more context for thrown errors
   * @param {number} timeout - maximal allowed duration in milliseconds
   */
  constructor({ description, timeout }) {
    /** @private */
    this._timeout = timeout;
    /** @public */
    this.description = description;

    this._schedule();
  }

  _schedule() {
    this._createdAt = Date.now();
    this._timeoutDeferred = new Deferred();
    this._timeoutHandle = setTimeout(() => {
      this._timeoutDeferred.resolve();
    }, this._timeout);
  }

  async run(action) {
    const error = new DetoxRuntimeError({
      message: `Exceeded timeout of ${this._timeout}ms while ${this.description}`,
      noStack: true,
    });

    return Promise.race([
      this._timeoutDeferred.promise.then(() => { throw error; }),
      Promise.resolve().then(action),
    ]);
  }

  dispose() {
    clearTimeout(this._timeoutHandle);
  }

  reset(extraDelayMs) {
    this._timeout = extraDelayMs;

    if (this._timeoutDeferred.status !== Deferred.PENDING) {
      this._schedule();
    } else {
      clearTimeout(this._timeoutHandle);
      this._timeoutHandle = setTimeout(() => this._timeoutDeferred.resolve(), extraDelayMs);
    }
  }

  static async run({ description, timeout, fn }) {
    const timer = new Timer({ description, timeout });
    try {
      await timer.run(fn);
    } finally {
      timer.dispose();
    }
  }
}

module.exports = Timer;
