const DetoxRuntimeError = require('../errors/DetoxRuntimeError');

class MissingDetox {
  constructor() {
    this.throwError = this.throwError.bind(this);
    this.initContext(this);

    this._defineRequiredProperty(this, 'beforeEach', async () => this.throwError(), true);
    this._defineRequiredProperty(this, 'afterEach', async () => this.throwError(), true);
  }

  initContext(context) {
    const readonly = context === this;

    this._defineRequiredProperty(context, 'by', undefined, readonly);
    this._defineRequiredProperty(context, 'device', undefined, readonly);
    this._defineRequiredProperty(context, 'element', this.throwError, readonly);
    this._defineRequiredProperty(context, 'expect', this.throwError, readonly);
    this._defineRequiredProperty(context, 'waitFor', this.throwError, readonly);
    this._defineRequiredProperty(context, 'web', undefined, readonly);
  }

  cleanupContext(context) {
    this._cleanupProperty(context, 'by');
    this._cleanupProperty(context, 'device');
    this._cleanupProperty(context, 'element');
    this._cleanupProperty(context, 'expect');
    this._cleanupProperty(context, 'waitFor');
  }

  _cleanupProperty(context, name) {
    if (context.hasOwnProperty(name)) {
      context[name] = undefined;
    }
  }

  _defineRequiredProperty(context, name, initialValue, readonly) {
    if (context.hasOwnProperty(name)) {
      return;
    }

    let _value = initialValue;

    const descriptor = {
      get: () => {
        if (_value === undefined) {
          this.throwError();
        }

        return _value;
      },
    };

    if (!readonly) {
      descriptor.set = (value) => {
        _value = value;
      };
    }

    Object.defineProperty(context, name, descriptor);
  }

  setError(err) {
    this._lastError = err;
  }

  throwError() {
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
