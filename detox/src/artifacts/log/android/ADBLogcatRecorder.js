const Recorder = require('../../core/factory/Recorder');
const ADBLogcatRecording = require('./ADBLogcatRecording');

class ADBLogcatRecorder extends Recorder {
  constructor(config) {
    super(config);

    this.adb = config.adb;
    this.bundleId = config.bundleId;
    this.deviceId = config.deviceId;
    this._logsCounter = 0;
  }

  createRecording() {
    return new ADBLogcatRecording({
      adb: this.adb,
      bundleId: this.bundleId,
      deviceId: this.deviceId,
      pathToLogOnDevice: this._generatePathOnDevice(),
    });
  }

  _generatePathOnDevice() {
    return `/sdcard/${this._logsCounter++}.log`;
  }
}

module.exports = ADBLogcatRecorder;
