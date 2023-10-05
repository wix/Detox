const fs = require('fs-extra');
const _ = require('lodash');
const plockfile = require('proper-lockfile');

const DetoxRuntimeError = require('../errors/DetoxRuntimeError');

const retry = require('./retry');

const DEFAULT_OPTIONS = {
  retry: { retries: 10000, interval: 5 },
  read: { encoding: 'utf8' },
  getInitialState: _.constant(null),
};

class ExclusiveLockfile {
  constructor(lockfile, options) {
    if (!lockfile) {
      throw new DetoxRuntimeError('Path to the lockfile should be a non-empty string');
    }

    this._lockFilePath = lockfile;
    this._options = _.defaultsDeep(options, DEFAULT_OPTIONS);

    this._isLocked = false;
    this._invalidate();
  }

  get options() {
    return this._options;
  }

  /***
   * @async
   * @param {Function} fn
   * @returns {Promise<any>}
   */
  async exclusively(fn) {
    await this._lock();

    try {
      return (await fn());
    } finally {
      await this._unlock();
    }
  }

  /***
   * @returns {any}
   */
  read() {
    if (!this._isLocked) {
      throw new DetoxRuntimeError('Forbidden to read in unlocked mode');
    }

    if (!this._hasValue) {
      this._value = this._doRead();
      this._hasValue = true;
    }

    return this._value;
  }

  /***
   * @param {any} value
   */
  write(value) {
    if (!this._isLocked) {
      throw new DetoxRuntimeError('Forbidden to write in unlocked mode');
    }

    this._value = value;
    this._hasValue = true;
  }

  /***
   * @private
   */
  _invalidate() {
    this._hasValue = false;
    this._value = null;
  }

  /***
   * @returns {any}
   * @private
   */
  _doRead() {
    const contents = fs.readFileSync(this._lockFilePath, this._options.read);
    // @ts-ignore Node.js can parse buffer as JSON
    return JSON.parse(contents);
  }

  /***
   * @param value
   * @private
   */
  _doWrite(value) {
    const contents = JSON.stringify(value);
    fs.writeFileSync(this._lockFilePath, contents);
  }

  /***
   * @returns {Promise<void>}
   * @private
   */
  async _lock() {
    this._ensureFileExists();

    await retry(this._options.retry, () => {
      const operationResult = plockfile.lockSync(this._lockFilePath);

      this._isLocked = true;
      this._invalidate();

      return operationResult;
    });
  }

  /***
   * @private
   */
  _ensureFileExists() {
    if (!fs.existsSync(this._lockFilePath)) {
      fs.ensureFileSync(this._lockFilePath);
      const initialState = this._options.getInitialState();
      this._doWrite(initialState);
    }
  }

  /***
   * @returns {Promise<void>}
   * @private
   */
  async _unlock() {
    if (this._hasValue) {
      this._doWrite(this._value);
    }

    plockfile.unlockSync(this._lockFilePath);
    this._isLocked = false;
    this._invalidate();
  }
}

module.exports = ExclusiveLockfile;
