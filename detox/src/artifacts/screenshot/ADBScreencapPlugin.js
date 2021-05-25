const Artifact = require('../templates/artifact/Artifact');

const ScreenshotArtifactPlugin = require('./ScreenshotArtifactPlugin');

class ADBScreencapPlugin extends ScreenshotArtifactPlugin {
  constructor(config) {
    super(config);

    this._adb = config.adb;
    this._devicePathBuilder = config.devicePathBuilder;
  }

  createTestArtifact() {
    const adb = this._adb;
    const deviceId = this.context.deviceId;
    const pathToScreenshotOnDevice = this._devicePathBuilder.buildTemporaryArtifactPath('.png');

    return new Artifact({
      name: 'ADBScreencapRecording',

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