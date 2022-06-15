const Artifact = require('../templates/artifact/Artifact');

class InstrumentsArtifactRecording extends Artifact {
  constructor({ device, userConfig, temporaryRecordingPath }) {
    super();

    this._device = device;
    this._userConfig = userConfig;
    this.temporaryRecordingPath = temporaryRecordingPath;
  }

  async doStart({ dry = false } = {}) {
    if (dry) {
      return; // nominal start, to preserve state change
    }

    await this._device.startInstrumentsRecording({
      recordingPath: this.temporaryRecordingPath,
      samplingInterval: this.prepareSamplingInterval(this._userConfig.samplingInterval)
    });
  }

  prepareSamplingInterval(samplingInterval) {
    return samplingInterval;
  }

  async doStop() {
    await this._device.stopInstrumentsRecording();
  }
}

module.exports = InstrumentsArtifactRecording;
