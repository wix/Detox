const tempfile = require('tempfile');
const LogArtifactPlugin = require('../LogArtifactPlugin');
const SimulatorLogRecording = require('./SimulatorLogRecording');

class SimulatorLogPlugin extends LogArtifactPlugin {
  constructor(config) {
    super(config);

    this.appleSimUtils = config.appleSimUtils;
  }

  async onBeforeShutdownDevice(event) {
    await super.onBeforeShutdownDevice(event);
    await this._tryToStopCurrentRecording();
  }

  async onBeforeLaunchApp(event) {
    await super.onBeforeLaunchApp(event);
    await this._tryToLaunchCurrentRecording();
  }

  async _tryToLaunchCurrentRecording() {
    if (this.currentRecording) {
      await this.currentRecording.start({
        udid: this.context.deviceId,
        bundleId: this.context.bundleId,
      });
    }
  }

  async _tryToStopCurrentRecording() {
    if (this.currentRecording) {
      await this.currentRecording.stop();
    }
  }

  createStartupRecording() {
    return this.createTestRecording();
  }

  createTestRecording() {
    return new SimulatorLogRecording({
      udid: this.context.deviceId,
      bundleId: this.context.bundleId,
      appleSimUtils: this.appleSimUtils,
      temporaryLogPath: tempfile('.log'),
    });
  }
}

module.exports = SimulatorLogPlugin;
