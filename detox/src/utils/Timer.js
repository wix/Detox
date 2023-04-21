const { DetoxRuntimeError, DetoxInternalError } = require('../errors');

const Deferred = require('./Deferred');

class Timer {
  constructor() {
    /** @private */
    this._eta = NaN;
    /** @private */
    this._timeout = NaN;
    /** @type {NodeJS.Timer | null} */
    this._timeoutHandle = null;
    /** @type {Deferred | null} */
    this._timeoutDeferred = null;
  }

  clear() {
    if (this._timeoutHandle) {
      clearTimeout(this._timeoutHandle);
      this._timeoutHandle = null;
    }

    this._eta = NaN;
    this._timeout = NaN;
    this._timeoutDeferred = null;
  }

  get expired() {
    return this._timeoutDeferred ? this._timeoutDeferred.isResolved() : false;
  }

  /**
   * @param {number} timeout - maximal allowed duration in milliseconds
   */
  schedule(timeout) {
    this.clear();

    this._eta = Date.now() + timeout;
    this._timeout = timeout;
    this._timeoutDeferred = new Deferred();
    this._timeoutHandle = setTimeout(() => {
      this._timeoutDeferred.resolve();
    }, this._timeout);

    return this;
  }

  extend(ms) {
    if (this.expired) {
      return this.schedule(ms);
    }

    clearTimeout(this._timeoutHandle);
    this._eta += ms;
    this._timeout += ms;
    this._timeoutHandle = setTimeout(() => {
      this._timeoutDeferred.resolve();
    }, this._eta - Date.now());
  }

  async run(description, action) {
    if (!this._timeoutDeferred) {
      throw new DetoxInternalError('Cannot run a timer action from an uninitialized timer');
    }

    const error = new DetoxRuntimeError({
      message: `Exceeded timeout of ${this._timeout}ms while ${description}`,
      noStack: true,
    });

    if (this.expired) {
      throw error;
    }

    return Promise.race([
      this._timeoutDeferred.promise.then(() => { throw error; }),
      Promise.resolve().then(action),
    ]);
  }

  static run(timeout, description, action) {
    const timer = new Timer();
    timer.schedule(timeout);
    return timer.run(description, action);
  }
}

module.exports = Timer;
