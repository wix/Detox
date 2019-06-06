const _ = require('lodash');
const tempfile = require('tempfile');
const LogArtifactPlugin = require('../LogArtifactPlugin');
const SimulatorLogRecording = require('./SimulatorLogRecording');

class SimulatorLogPlugin extends LogArtifactPlugin {
  constructor(config) {
    super(config);

    this.appleSimUtils = config.appleSimUtils;
    this.priority = 8;
  }

  async onBeforeLaunchApp(event) {
    await super.onBeforeLaunchApp(event);
    await this.onReadyToRecord();

    if (this.currentRecording) {
      await this.currentRecording.start({
        udid: this.context.deviceId,
        bundleId: this.context.bundleId,
      });
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
      config: {
        delayAfterStart: 50,
        delayBeforeStop: 50,
        delayBeforeSigterm: 200,
      },
    });
  }
}

module.exports = SimulatorLogPlugin;
