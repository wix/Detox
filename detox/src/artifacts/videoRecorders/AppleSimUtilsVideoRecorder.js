const tempfile = require('tempfile');
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
      udid: this.udid,
      artifactPath: ensureExtension(artifactPath, '.mp4'),
      temporaryFilePath: tempfile('.mp4'),
    });
  }
}

module.exports = AppleSimUtilsVideoRecorder;