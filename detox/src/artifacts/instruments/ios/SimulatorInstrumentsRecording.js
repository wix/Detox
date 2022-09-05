// @ts-nocheck
const fs = require('fs-extra');
const _ = require('lodash');

const log = require('../../../utils/logger').child({ cat: 'artifact' });
const FileArtifact = require('../../templates/artifact/FileArtifact');
const InstrumentsArtifactRecording = require('../InstrumentsArtifactRecording');

class SimulatorInstrumentsRecording extends InstrumentsArtifactRecording {
  constructor({ pluginContext, client, userConfig, temporaryRecordingPath }) {
    super({ pluginContext, client, userConfig, temporaryRecordingPath });
  }

  static prepareSamplingInterval(samplingInterval) {
    if (samplingInterval) {
      return samplingInterval / 1000;
    }
    return 0.25;
  }

  prepareSamplingInterval(samplingInterval) {
    return SimulatorInstrumentsRecording.prepareSamplingInterval(samplingInterval);
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
