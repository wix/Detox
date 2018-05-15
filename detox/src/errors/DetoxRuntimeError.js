class DetoxRuntimeError extends Error {
  constructor({ message, hint, debugInfo }) {
    super(message);
    this.hint = hint || "";
    this.debugInfo = debugInfo || "";
  }
}

module.exports = DetoxRuntimeError;
