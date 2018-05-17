const AppleSimUtilsLogTailRecording = require('./AppleSimUtilsLogTailRecording');

// TODO: implement
class AppleSimUtilsLogger {
  constructor({}) {
  }

  recordLog(artifactPath) {
    return new AppleSimUtilsLogTailRecording({
      artifactPath,
    });
  }
}

module.exports = AppleSimUtilsLogger;