const LogArtifactPlugin = require('../LogArtifactPlugin');
const ADBLogcatRecording = require('./ADBLogcatRecording');

class ADBLogcatPlugin extends LogArtifactPlugin {
  constructor(config) {
    super(config);

    this._adb = config.adb;
    this._devicePathBuilder = config.devicePathBuilder;
  }

  async onLaunchApp(event) {
    await super.onLaunchApp(event);

    if (this.currentRecording) {
      await this.currentRecording.start({ pid: event.pid });
    }
  }

  createStartupRecording() {
    return this.createTestRecording();
  }

  createTestRecording() {
    const { deviceId, bundleId, pid } = this.context;

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