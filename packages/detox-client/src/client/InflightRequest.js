const DetoxRuntimeError = require('../errors/DetoxRuntimeError');
const Deferred = require('../utils/Deferred');

class InflightRequest extends Deferred {
  constructor(message) {
    super();

    this._timeoutHandle = null;
    this.message = message;
  }

  resolve(value) {
    this.clearTimeout();
    return super.resolve(value);
  }

  reject(reason) {
    this.clearTimeout();

    const { messageId, type } = this.message;
    return super.reject(new DetoxRuntimeError({
      message: `The pending request #${messageId} ("${type}") has been rejected due to the following error:`,
      debugInfo: reason,
    }));
  }

  withTimeout(ms) {
    if (ms > 0) {
      this._timeoutHandle = setTimeout(() => {
        this.reject(new DetoxRuntimeError({
          message: `The tester has not received a response within ${ms}ms timeout to the message:`,
          debugInfo: this.message,
        }));
      }, ms);
    }

    return this;
  }

  clearTimeout() {
    if (this._timeoutHandle) {
      clearTimeout(this._timeoutHandle);
      this._timeoutHandle = null;
    }

    return this;
  }
}

module.exports = InflightRequest;
