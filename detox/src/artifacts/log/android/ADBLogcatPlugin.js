const LogArtifactPlugin = require('../LogArtifactPlugin');
const ADBLogcatRecording = require('./ADBLogcatRecording');

class ADBLogcatPlugin extends LogArtifactPlugin {
  constructor(config) {
    super(config);

    this._adb = config.adb;
    this._devicePathBuilder = config.devicePathBuilder;
  }

  async onRelaunchApp({ pid }) {
    if (this.currentRecording) {
      await this.currentRecording.start({ pid });
    }
  }

  createStartupRecording() {
    return this.createTestRecording();
  }

  createTestRecording() {
    const deviceId = this.api.getDeviceId();
    const bundleId = this.api.getBundleId();
    const pid = this.api.getPid(bundleId);

    return new ADBLogcatRecording({
      adb: this._adb,
      deviceId,
      bundleId,
      pid,
      pathToLogOnDevice: this._devicePathBuilder.buildTemporaryArtifactPath('.log'),
    });
  }
}

module.exports = ADBLogcatPlugin;