class DetoxError extends Error {
  constructor(message) {
    super(message);
    Error.stackTraceLimit = 0;

    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
  }
}

module.exports = DetoxError;
