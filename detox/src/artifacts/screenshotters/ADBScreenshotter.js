const ensureExtension = require('../utils/ensureExtension');
const ADBScreenshotHandle = require('./ADBScreenshotHandle');

class ADBScreenshotter {
  constructor(config) {
    this.adb = config.adb;
    this.deviceId = config.deviceId;
    this._screenshotsCounter = 0;
  }

  async takeScreenshot(artifactPath) {
    const pathToScreenshotOnDevice = this._generatePathOnDevice();
    await this.adb.screencap(this.deviceId, pathToScreenshotOnDevice);

    return new ADBScreenshotHandle({
      adb: this.adb,
      deviceId: this.deviceId,
      artifactPath: ensureExtension(artifactPath, '.png'),
      pathToScreenshotOnDevice,
    });
  }

  _generatePathOnDevice() {
    return `/sdcard/${this._screenshotsCounter++}.png`;
  }
}

module.exports = ADBScreenshotter;