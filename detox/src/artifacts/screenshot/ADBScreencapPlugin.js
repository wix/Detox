const ScreenshotArtifactPlugin = require('./ScreenshotArtifactPlugin');
const Artifact = require('../templates/artifact/Artifact');

class ADBScreencapPlugin extends ScreenshotArtifactPlugin {
  constructor(config) {
    super(config);

    this.adb = config.adb;
    this._screenshotsCounter = 0;
  }

  createTestArtifact() {
    const adb = this.adb;
    const deviceId = this.api.getDeviceId();
    const pathToScreenshotOnDevice = `/sdcard/${this._screenshotsCounter++}.png`;

    return new Artifact({
      async start() {
        await adb.screencap(deviceId, pathToScreenshotOnDevice);
      },

      async save(artifactPath) {
        await adb.pull(deviceId, pathToScreenshotOnDevice, artifactPath);
        await adb.rm(deviceId, pathToScreenshotOnDevice);
      },

      async discard() {
        await adb.rm(deviceId, pathToScreenshotOnDevice);
      },
    });
  }
}

module.exports = ADBScreencapPlugin;