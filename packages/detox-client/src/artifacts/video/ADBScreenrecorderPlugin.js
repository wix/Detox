const ADBScreenrecorderArtifact = require('./ADBScreenrecorderArtifact');
const VideoArtifactPlugin = require('./VideoArtifactPlugin');

class ADBScreenrecorderPlugin extends VideoArtifactPlugin {
  constructor(config) {
    super(config);

    this._adb = config.adb;
    this._devicePathBuilder = config.devicePathBuilder;
  }

  createTestRecording() {
    return new ADBScreenrecorderArtifact({
      adb: this._adb,
      deviceId: this.context.deviceId,
      pathToVideoOnDevice: this._devicePathBuilder.buildTemporaryArtifactPath('.mp4'),
      screenRecordOptions: this.api.userConfig.android,
    });
  }
}

module.exports = ADBScreenrecorderPlugin;
