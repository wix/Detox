const SimulatorLogRecording = require('./SimulatorLogRecording');

// TODO: implement
class SimulatorLogRecorder {
  constructor({}) {
  }

  record(artifactPath) {
    return new SimulatorLogRecorder({
      artifactPath,
    });
  }
}

module.exports = SimulatorLogRecorder;