const Recorder = require('../../core/factory/Recorder');
const SimulatorLogRecording = require('./SimulatorLogRecording');

// TODO: implement
class SimulatorLogRecorder extends Recorder {
  constructor(config) {
    super(config);

    this.udid = config.udid;
  }

  createRecording() {
    return new SimulatorLogRecording({
      udid: this.udid,
    });
  }
}

module.exports = SimulatorLogRecorder;