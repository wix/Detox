const tempfile = require('tempfile');
const LogArtifactPlugin = require('../LogArtifactPlugin');
const SimulatorLogRecording = require('./SimulatorLogRecording');

class SimulatorLogPlugin extends LogArtifactPlugin {
  constructor(config) {
    super(config);

    this.appleSimUtils = config.appleSimUtils;
  }

  async onShutdownDevice(event) {
    await super.onShutdownDevice(event);

    if (this.currentRecording) {
      await this.currentRecording.stop();
    }
  }

  async onLaunchApp(event) {
    await super.onLaunchApp(event);

    if (this.currentRecording) {
      await this.currentRecording.start();
    }
  }

  createStartupRecording() {
    return this._createRecording(true);
  }

  createTestRecording() {
    return this._createRecording(false);
  }

  _createRecording(readFromBeginning) {
    const udid = this.context.deviceId;
    const { stdout, stderr } = this.appleSimUtils.getLogsPaths(udid);

    return new SimulatorLogRecording({
      temporaryLogPath: tempfile('.log'),
      logStderr: stderr,
      logStdout: stdout,
      readFromBeginning,
    });
  }
}

module.exports = SimulatorLogPlugin;