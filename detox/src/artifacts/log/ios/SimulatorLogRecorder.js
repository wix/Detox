const tempfile = require('tempfile');
const Recorder = require('../../core/factory/Recorder');
const SimulatorLogRecording = require('./SimulatorLogRecording');

// TODO: implement
class SimulatorLogRecorder extends Recorder {
  constructor(config) {
    super(config);

    this.appleSimUtils = config.appleSimUtils;
    this.udid = config.udid;
  }

  createRecording() {
    const { stdout, stderr } = this.appleSimUtils.getLogsPaths(this.udid);

    return new SimulatorLogRecording({
      stdoutPath: stdout,
      stderrPath: stderr,
      temporaryLogPath: tempfile('.log'),
    });
  }
}

module.exports = SimulatorLogRecorder;