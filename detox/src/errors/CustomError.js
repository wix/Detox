
class CustomError extends Error {
  constructor(...args) {
    super(...args);
    Object.defineProperty(this, "name", {
      value: this.constructor.name
    });
    Error.stackTraceLimit = 0;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = CustomError;
