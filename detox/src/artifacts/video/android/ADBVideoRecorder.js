const Recorder = require('../../core/factory/Recorder');
const AndroidVideoRecording = require('./ADBVideoRecording');

class ADBVideoRecorder extends Recorder {
  constructor(config) {
    super(config);

    this.adb = config.adb;
    this.deviceId = config.deviceId;
    this.screenRecordOptions = config.screenRecordOptions;
    this._videosCounter = 0;
  }

  createRecording() {
    return new AndroidVideoRecording({
      adb: this.adb,
      deviceId: this.deviceId,
      pathToVideoOnDevice: this._generatePathOnDevice(),
      screenRecordOptions: this.screenRecordOptions,
    });
  }

  _generatePathOnDevice() {
    return `/sdcard/${this._videosCounter++}.mp4`;
  }
}

module.exports = ADBVideoRecorder;
