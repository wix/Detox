class DetoxRuntimeError extends Error {
  constructor({ message = '', hint = '', debugInfo = '' } = {}) {
    super(message);

    Error.captureStackTrace(this, DetoxRuntimeError);
    this.hint = hint;
    this.debugInfo = debugInfo;

    if (typeof jest !== 'undefined') {
      this.message = this.toString();
    }
  }

  toString() {
    return `${this.constructor.name}: ${this.message}` +
      '\n\nHINT: ' + this.hint +
      '\n\n' + this.debugInfo;
  }
}

module.exports = DetoxRuntimeError;
