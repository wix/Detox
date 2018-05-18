const ADBLogcatRecording = require('./ADBLogcatRecording');

class ADBLogcatRecorder {
  constructor(config) {
    this.adb = config.adb;
  }

  record(artifactPath) {
    return new ADBLogcatRecording({
      artifactPath,
    });
  }
}

module.exports = ADBLogcatRecorder;
