const tempfile = require('tempfile');
const LogArtifactPlugin = require('../LogArtifactPlugin');
const SimulatorLogRecording = require('./SimulatorLogRecording');

class SimulatorLogPlugin extends LogArtifactPlugin {
  constructor(config) {
    super(config);

    this.appleSimUtils = config.appleSimUtils;
  }

  async onBeforeResetDevice() {
    await this.currentRecording.stop();
  }

  async onRelaunchApp() {
    await this.currentRecording.restart();
  }

  createStartupRecording() {
    return this._createRecording(true);
  }

  createTestRecording() {
    return this._createRecording(false);
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