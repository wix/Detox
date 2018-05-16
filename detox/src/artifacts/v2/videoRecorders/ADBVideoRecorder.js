const ensureExtension = require('../utils/ensureExtension');
const AndroidVideoRecording = require('./ADBVideoRecording');

class ADBVideoRecorder {
  constructor(config) {
    this.adb = config.adb;
    this.deviceId = config.deviceId;
    this.screenRecordOptions = config.screenRecordOptions;
    this._videosCounter = 0;
  }

  recordVideo(artifactPath) {
    return new AndroidVideoRecording({
      adb: this.adb,
      artifactPath: ensureExtension(artifactPath, '.mp4'),
      pathToVideoOnDevice: this._generatePathOnDevice(),
      deviceId: this.deviceId,
      screenRecordOptions: this.screenRecordOptions,
    });
  }

  _generatePathOnDevice() {
    return `/sdcard/${this._videosCounter++}.mp4`;
  }
}

module.exports = ADBVideoRecorder;
