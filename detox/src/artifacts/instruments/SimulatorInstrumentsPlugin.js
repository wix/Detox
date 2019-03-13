const argparse = require('../../utils/argparse');
const tempfile = require('tempfile');
const WholeTestRecorderPlugin = require('../templates/plugin/WholeTestRecorderPlugin');
const SimulatorInstrumentsRecording = require('./SimulatorInstrumentsRecording');

class SimulatorInstrumentsPlugin extends WholeTestRecorderPlugin {
  constructor(config) {
    super(config);

    const recordPerformance = argparse.getArgValue('record-performance');

    this.client = config.client;
    this.enabled = recordPerformance !== 'none'
      ? Boolean(recordPerformance)
      : false;
  }

  async onBeforeTerminateApp(event) {
    await super.onBeforeTerminateApp(event);
    await this._stopRecordingIfExists();
  }

  async onBeforeShutdownDevice(event) {
    await super.onBeforeShutdownDevice(event);
    await this._stopRecordingIfExists();
  }

  async _stopRecordingIfExists() {
    if (this.testRecording) {
      await this.testRecording.stop();
    }
  }

  async onBeforeLaunchApp(event) {
    await super.onBeforeLaunchApp(event);

    if (this.testRecording && this.enabled) {
      event.launchArgs['-recordingPath'] = this.testRecording.temporaryRecordingPath;
    }
  }

  async onLaunchApp(event) {
    await super.onLaunchApp(event);

    if (this.testRecording && this.enabled) {
      // doing a nominal start, without doing anything useful
      // to preserve correct recording state
      await this.testRecording.start({ dry: true });
    }
  }

  createTestRecording() {
    return new SimulatorInstrumentsRecording({
      client: this.client,
      temporaryRecordingPath: tempfile('.dtxrec'),
    });
  }

  async preparePathForTestArtifact(testSummary) {
    return this.api.preparePathForArtifact('test.dtxrec', testSummary);
  }
}

module.exports = SimulatorInstrumentsPlugin;
