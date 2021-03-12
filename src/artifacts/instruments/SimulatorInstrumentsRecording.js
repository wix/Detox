const _ = require('lodash');
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
    const success = await Artifact.moveTemporaryFile(log, this.temporaryRecordingPath, artifactPath);
    if (!success) {
      SimulatorInstrumentsRecording.hintAboutDetoxInstruments();
    }
  }

  async doDiscard() {
    await fs.remove(this.temporaryRecordingPath);
  }

  _isClientConnected() {
    return this._client.isConnected && !this._client.pandingAppCrash;
  }
}

SimulatorInstrumentsRecording.hintAboutDetoxInstruments = _.once(() => {
  log.warn(`Make sure either:
1. You have installed Detox Instruments:
   https://github.com/wix/DetoxInstruments#installation 
2. You have integrated Detox Instruments in your app:
   https://github.com/wix/DetoxInstruments/blob/master/Documentation/XcodeIntegrationGuide.md 
3. You have set the environment variable with your custom Detox Instruments location:
   export DETOX_INSTRUMENTS_PATH="/path/to/Detox Instruments.app"`);
});

module.exports = SimulatorInstrumentsRecording;
