class DetoxRuntimeError extends Error {
  constructor({ message = '', hint = '', debugInfo = '' } = {}) {
    super(`DetoxRuntimeError: ${message}` +
      (!hint ? '' : '\n\nHINT: ' + hint) +
      (!debugInfo ? '' : '\n\n' + debugInfo));

    Error.captureStackTrace(this, DetoxRuntimeError);
  }

  toString() {
    return super.toString().replace(/^Error: /, '\n');
  }
}

module.exports = DetoxRuntimeError;
