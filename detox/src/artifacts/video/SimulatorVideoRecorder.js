const tempfile = require('tempfile');
const ensureExtension = require('../../utils/ensureExtension');
const SimulatorVideoRecording = require('./SimulatorVideoRecording');

class SimulatorVideoRecorder {
  constructor(config) {
    this.appleSimUtils = config.appleSimUtils;
    this.udid = config.udid;
  }

  record(artifactPath) {
    return new SimulatorVideoRecording({
      appleSimUtils: this.appleSimUtils,
      udid: this.udid,
      artifactPath: ensureExtension(artifactPath, '.mp4'),
      temporaryFilePath: tempfile('.mp4'),
    });
  }
}

module.exports = SimulatorVideoRecorder;