const DetoxError = require('./DetoxError');

class DetoxInternalError extends DetoxError {
  constructor(message) {
    super(message + '\n' + DetoxError.reportIssue);
    this.name = 'DetoxInternalError';
  }

  static from(message) {
    return new DetoxInternalError(message).toString();
  }
}

module.exports = DetoxInternalError;
