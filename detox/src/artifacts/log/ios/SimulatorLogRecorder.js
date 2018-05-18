const tempfile = require('tempfile');
const Recorder = require('../../core/factory/Recorder');
const SimulatorLogRecording = require('./SimulatorLogRecording');

class SimulatorLogRecorder extends Recorder {
  constructor(config) {
    super(config);

    this.appleSimUtils = config.appleSimUtils;
    this.udid = config.udid;
    this.started = false;
  }

  createRecording() {
    const { stdout, stderr } = this.appleSimUtils.getLogsPaths(this.udid);

    const recording = new SimulatorLogRecording({
      stdoutPath: stdout,
      stderrPath: stderr,
      temporaryLogPath: tempfile('.log'),
      fromBeginning: !this.started,
    });

    this.started = true;
    return recording;
  }
}

module.exports = SimulatorLogRecorder;