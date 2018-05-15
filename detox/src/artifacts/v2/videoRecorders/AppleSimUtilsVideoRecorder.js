const ensureExtension = require('../utils/ensureExtension');
const IosVideoRecording = require('./AppleSimUtilsVideoRecording');

class AppleSimUtilsVideoRecorder {
  constructor(config) {
    this.appleSimUtils = config.appleSimUtils;
    this.udid = config.udid;
  }

  recordVideo(artifactPath) {
    return new IosVideoRecording({
      appleSimUtils: this.appleSimUtils,
      artifactPath: ensureExtension(artifactPath, '.mp4'),
      udid: this.udid,
      videoId: String(this._recordingCounter++),
      screenRecordOptions: this.screenRecordOptions,
    });
  }
}

module.exports = AppleSimUtilsVideoRecorder;