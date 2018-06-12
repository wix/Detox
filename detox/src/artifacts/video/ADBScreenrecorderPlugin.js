const VideoArtifactPlugin = require('./VideoArtifactPlugin');
const ADBScreenrecorderArtifact = require('./ADBScreenrecorderArtifact');

class ADBScreenrecorderPlugin extends VideoArtifactPlugin {
  constructor(config) {
    super(config);

    this._adb = config.adb;
    this._devicePathBuilder = config.devicePathBuilder;
  }

  createTestRecording() {
    return new ADBScreenrecorderArtifact({
      adb: this._adb,
      deviceId: this.api.getDeviceId(),
      pathToVideoOnDevice: this._devicePathBuilder.buildTemporaryArtifactPath('.mp4'),
    });
  }
}

module.exports = ADBScreenrecorderPlugin;
