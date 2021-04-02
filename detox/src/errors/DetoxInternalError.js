class DetoxInternalError extends Error {
  constructor(message) {
    super(message + '\n' + DetoxInternalError.reportIssue);
    this.name = 'DetoxInternalError';
  }

  static from(message) {
    return new DetoxInternalError(message).toString();
  }

  static get reportIssue() {
    return 'Please report this issue on our GitHub tracker:\nhttps://github.com/wix/Detox/issues';
  }
}

module.exports = DetoxInternalError;
