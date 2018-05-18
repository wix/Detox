const ensureExtension = require('../../utils/ensureExtension');
const ADBScreenshot = require('./ADBScreenshot');

class ADBScreenshotter {
  constructor(config) {
    this.adb = config.adb;
    this.deviceId = config.deviceId;
    this._screenshotsCounter = 0;
  }

  async snapshot(artifactPath) {
    return new ADBScreenshot({
      adb: this.adb,
      deviceId: this.deviceId,
      artifactPath: ensureExtension(artifactPath, '.png'),
      pathToScreenshotOnDevice: this._generatePathOnDevice(),
    });
  }

  _generatePathOnDevice() {
    return `/sdcard/${this._screenshotsCounter++}.png`;
  }
}

module.exports = ADBScreenshotter;