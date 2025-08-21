const Artifact = require('../templates/artifact/Artifact');

const ScreenshotArtifactPlugin = require('./ScreenshotArtifactPlugin');

class ADBScreencapPlugin extends ScreenshotArtifactPlugin {
  constructor(config) {
    super(config);

    this._adb = config.adb;
    this._devicePathBuilder = config.devicePathBuilder;
  }

  createTestArtifact() {
    const deviceId = this.context.deviceId;
    const adb = this._adb.bind({ deviceId });
    const pathToScreenshotOnDevice = this._devicePathBuilder.buildTemporaryArtifactPath('.png');

    return new Artifact({
      name: 'ADBScreencapRecording',

      async start() {
        await adb.screencap(pathToScreenshotOnDevice);
      },

      async save(artifactPath) {
        await adb.pull(pathToScreenshotOnDevice, artifactPath);
        await adb.rm(pathToScreenshotOnDevice);
      },

      async discard() {
        await adb.rm(pathToScreenshotOnDevice);
      },
    });
  }
}

module.exports = ADBScreencapPlugin;
