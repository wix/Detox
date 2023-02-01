const Artifact = require('../templates/artifact/Artifact');

class InstrumentsArtifactRecording extends Artifact {
  constructor({ client, userConfig, temporaryRecordingPath }) {
    super();

    this._client = client;
    this._userConfig = userConfig;
    this.temporaryRecordingPath = temporaryRecordingPath;
  }

  async doStart({ dry = false } = {}) {
    if (dry) {
      return; // nominal start, to preserve state change
    }

    if (!this._isClientConnected()) {
      return;
    }

    await this._client.startInstrumentsRecording({
      recordingPath: this.temporaryRecordingPath,
      samplingInterval: this.prepareSamplingInterval(this._userConfig.samplingInterval)
    });
  }

  prepareSamplingInterval(samplingInterval) {
    return samplingInterval;
  }

  async doStop() {
    if (this._isClientConnected()) {
      await this._client.stopInstrumentsRecording();
    }
  }

  _isClientConnected() {
    return this._client.isConnected;
  }
}

module.exports = InstrumentsArtifactRecording;
