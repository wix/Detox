const _ = require('lodash');
const log = require('../../../utils/logger').child({ __filename });
const InstrumentsArtifactRecording = require('../InstrumentsArtifactRecording');
const FileArtifact = require('../../templates/artifact/FileArtifact');

class SimulatorInstrumentsRecording extends InstrumentsArtifactRecording {
  constructor({ pluginContext, client, temporaryRecordingPath }) {
    super({ client, temporaryRecordingPath });

    this._pluginContext = pluginContext;
  }

  async doSave(artifactPath) {
    const success = await FileArtifact.moveTemporaryFile(log, this.temporaryRecordingPath, artifactPath);
    if (!success) {
      SimulatorInstrumentsRecording.hintAboutDetoxInstruments();
    }
  }

  async doDiscard() {
    await fs.remove(this.temporaryRecordingPath);
  }


  _isClientConnected() {
    const isConnectedToDetoxServer = super._isClientConnected();
    const isAppRunning = this._pluginContext.bundleId;

    return Boolean(isConnectedToDetoxServer && isAppRunning);
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
