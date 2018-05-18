const Recorder = require('../../core/factory/Recorder');
const ADBLogcatRecording = require('./ADBLogcatRecording');

class ADBLogcatRecorder extends Recorder {
  constructor(config) {
    super(config);

    this.adb = config.adb;
  }

  createRecording() {
    return new ADBLogcatRecording({});
  }
}

module.exports = ADBLogcatRecorder;
