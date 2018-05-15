const ADBLogcatTailRecording = require('./ADBLogcatTailRecording');

class ADBLogcatLogger {
  constructor(config) {
    this.adb = config.adb;
  }

  recordLog(artifactPath) {
    return new ADBLogcatTailRecording({
      artifactPath,
    });
  }
}

module.exports = ADBLogcatLogger;
