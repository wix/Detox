const Recorder = require('../../core/factory/Recorder');
const tempfile = require('tempfile');
const SimulatorVideoRecording = require('./SimulatorVideoRecording');

class SimulatorVideoRecorder extends Recorder {
  constructor(config) {
    super(config);

    this.appleSimUtils = config.appleSimUtils;
    this.udid = config.udid;
  }

  createRecording() {
    return new SimulatorVideoRecording({
      appleSimUtils: this.appleSimUtils,
      udid: this.udid,
      temporaryFilePath: tempfile('.mp4'),
    });
  }
}

module.exports = SimulatorVideoRecorder;