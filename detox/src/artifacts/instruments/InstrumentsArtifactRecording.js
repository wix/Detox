const Artifact = require('../templates/artifact/Artifact');

class InstrumentsArtifactRecording extends Artifact {
  constructor({ runtimeDriver, userConfig, temporaryRecordingPath }) {
    super();

    this._runtimeDriver = runtimeDriver;
    this._userConfig = userConfig;
    this.temporaryRecordingPath = temporaryRecordingPath;
  }

  async doStart({ dry = false } = {}) {
    if (dry) {
      return; // nominal start, to preserve state change
    }

    await this._runtimeDriver.startInstrumentsRecording({
      recordingPath: this.temporaryRecordingPath,
      samplingInterval: this.prepareSamplingInterval(this._userConfig.samplingInterval)
    });
  }

  prepareSamplingInterval(samplingInterval) {
    return samplingInterval;
  }

  async doStop() {
    await this._runtimeDriver.stopInstrumentsRecording();
  }
}

module.exports = InstrumentsArtifactRecording;
