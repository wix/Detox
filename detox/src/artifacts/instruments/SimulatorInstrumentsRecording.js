const log = require('../../utils/logger').child({ __filename });
const Artifact = require('../templates/artifact/Artifact');

class SimulatorInstrumentsRecording extends Artifact {
  constructor({
    client,
    temporaryRecordingPath,
  }) {
    super();

    this._client = client;
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
    });
  }

  async doStop() {
    if (this._isClientConnected()) {
      await this._client.stopInstrumentsRecording();
    }
  }

  async doSave(artifactPath) {
    await Artifact.moveTemporaryFile(log, this.temporaryRecordingPath, artifactPath);
  }

  async doDiscard() {
    await fs.remove(this.temporaryRecordingPath);
  }

  _isClientConnected() {
    return this._client.isConnected && !this._client.pandingAppCrash;
  }
}

module.exports = SimulatorInstrumentsRecording;
