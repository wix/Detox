const VideoArtifactPlugin = require('./VideoArtifactPlugin');
const ADBScreenrecorderArtifact = require('./ADBScreenrecorderArtifact');

class ADBScreenrecorderPlugin extends VideoArtifactPlugin {
  constructor(config) {
    super(config);

    this.adb = config.adb;
    this._videosCounter = 0;
  }

  createTestRecording() {
    return new ADBScreenrecorderArtifact({
      adb: this.adb,
      deviceId: this.api.getDeviceId(),
      pathToVideoOnDevice: `/sdcard/${this._videosCounter++}.mp4`,
    });
  }
}

module.exports = ADBScreenrecorderPlugin;
