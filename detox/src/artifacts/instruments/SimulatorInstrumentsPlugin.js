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

  async onBeforeShutdownDevice(event) {
    await super.onBeforeShutdownDevice(event);

    if (this.currentRecording) {
      await this.currentRecording.stop();
    }
  }

  async onBeforeLaunchApp(event) {
    await super.onBeforeLaunchApp(event);

    if (this.currentRecording) {
      await this.currentRecording.stop();

      if (this.enabled) {
        event.launchArgs['-recordingPath'] = this.currentRecording.temporaryRecordingPath;
      }
    }
  }

  async onLaunchApp(event) {
    await super.onLaunchApp(event);

    if (this.currentRecording && this.enabled) {
      // doing a nominal start, without doing anything useful
      // to preserve correct recording state
      await this.currentRecording.start({ dry: true });
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
