const InstrumentsArtifactPlugin = require('../InstrumentsArtifactPlugin');
const SimulatorInstrumentsRecording = require('./SimulatorInstrumentsRecording');
const temporaryPath = require('../../utils/temporaryPath');

class SimulatorInstrumentsPlugin extends InstrumentsArtifactPlugin {
  constructor({api, client}) {
    super({api});

    this.client = client;
  }

  async onBeforeLaunchApp(event) {
    await super.onBeforeLaunchApp(event);

    if (this.testRecording) {
      event.launchArgs['recordingPath'] = this.testRecording.temporaryRecordingPath;
      event.launchArgs['samplingInterval'] =
        SimulatorInstrumentsRecording.prepareSamplingInterval(this.api.userConfig.samplingInterval);
    }

    if (process.env.DETOX_INSTRUMENTS_PATH) {
      event.launchArgs['instrumentsPath'] = process.env.DETOX_INSTRUMENTS_PATH;
    }
  }

  async preparePathForTestArtifact(testSummary) {
    return this.api.preparePathForArtifact('test.dtxrec', testSummary);
  }

  createTestRecording() {
    return new SimulatorInstrumentsRecording({
      pluginContext: this.context,
      client: this.client,
      userConfig: this.api.userConfig,
      temporaryRecordingPath: temporaryPath.for.dtxrec(),
    });
  }
}

module.exports = SimulatorInstrumentsPlugin;
