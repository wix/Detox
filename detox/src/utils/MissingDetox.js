const DetoxRuntimeError = require('../errors/DetoxRuntimeError');

class MissingDetox {
  constructor(invocationManager) {
    this.throwError = this._throwError.bind(this);

    this.by = {
      accessibilityLabel: this.throwError,
      label: this.throwError,
      id: this.throwError,
      type: this.throwError,
      traits: this.throwError,
      value: this.throwError,
      text: this.throwError,
    };

    this.element = this.throwError;
    this.expect = this.throwError;
    this.waitFor = this.throwError;
  }

  get device() {
    this.throwError();
  }

  get by() {
    this.throwError();
  }

  setError(err) {
    this._lastError = err;
  }

  _throwError() {
    throw new DetoxRuntimeError({
      message: 'Detox instance has not been initialized',
      hint: this._lastError
        ? 'There was an error on attempt to call detox.init()'
        : 'Make sure to call detox.init() before your test begins',
      debugInfo: this._lastError && this._lastError.stack || '',
    });
  }
}

module.exports = MissingDetox;
