const tempfile = require('tempfile');
const LogArtifactPlugin = require('../LogArtifactPlugin');
const SimulatorLogRecording = require('./SimulatorLogRecording');

class SimulatorLogPlugin extends LogArtifactPlugin {
  constructor(config) {
    super(config);

    this.appleSimUtils = config.appleSimUtils;
  }

  createStartupRecording() {
    return this._createRecording(true);
  }

  createTestRecording() {
    return this._createRecording(false);
  }

  async onBeforeResetDevice() {
    if (this.currentRecording) {
      await this.currentRecording.stop();
    }
  }

  async onRelaunchApp() {
    if (this.currentRecording) {
      await this.currentRecording.start();
    }
  }

  _createRecording(readFromBeginning) {
    const udid = this.api.getDeviceId();
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