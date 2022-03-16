// @ts-nocheck
const LogArtifactPlugin = require('../LogArtifactPlugin');

const ADBLogcatRecording = require('./ADBLogcatRecording');

class ADBLogcatPlugin extends LogArtifactPlugin {
  constructor(config) {
    super(config);

    this._adb = config.adb;
    this._devicePathBuilder = config.devicePathBuilder;
    this._lastTimestamp = '';
  }

  async onBeforeLaunchApp(event) {
    await super.onBeforeLaunchApp(event);
    this._lastTimestamp = await this._adb.now(event.deviceId);
  }

  async onLaunchApp(event) {
    await super.onLaunchApp(event);
    await this.onReadyToRecord();

    if (this.currentRecording) {
      await this.currentRecording.start();
    }
  }

  createStartupRecording() {
    return this.createTestRecording();
  }

  createTestRecording() {
    const { deviceId, bundleId } = this.context;

    return new ADBLogcatRecording({
      adb: this._adb,
      deviceId,
      bundleId,
      pid: {
        get: () => this.context.pid,
      },
      since: {
        get: () => this._lastTimestamp,
        set: (value) => { this._lastTimestamp = value; },
      },
      pathToLogOnDevice: this._devicePathBuilder.buildTemporaryArtifactPath('.log'),
    });
  }
}

module.exports = ADBLogcatPlugin;
