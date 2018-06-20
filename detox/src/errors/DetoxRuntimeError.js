class DetoxRuntimeError extends Error {
  constructor({ message = '', hint = '', debugInfo = '' } = {}) {
    super(message);

    Error.captureStackTrace(this, DetoxRuntimeError);
    this.hint = hint;
    this.debugInfo = debugInfo;

    if (DetoxRuntimeError.formatMessagesOnFly) {
      this.message = this.toString();
    }
  }

  toString() {
    return `${this.constructor.name}: ${this.message}` +
      (!this.hint ? '' : '\n\nHINT: ' + this.hint) +
      (!this.debugInfo ? '' : '\n\n' + this.debugInfo);
  }
}

DetoxRuntimeError.formatMessagesOnFly = typeof jest !== 'undefined';

module.exports = DetoxRuntimeError;
