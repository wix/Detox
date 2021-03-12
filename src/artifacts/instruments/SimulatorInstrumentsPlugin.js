const fs = require('fs-extra');
const tempfile = require('tempfile');
const argparse = require('../../utils/argparse');
const log = require('../../utils/logger').child({ __filename });
const WholeTestRecorderPlugin = require('../templates/plugin/WholeTestRecorderPlugin');
const SimulatorInstrumentsRecording = require('./SimulatorInstrumentsRecording');

class SimulatorInstrumentsPlugin extends WholeTestRecorderPlugin {
  constructor(config) {
    super(config);

    this.client = config.client;
    this.enabled = argparse.getArgValue('record-performance') === 'all';
  }

  async onBeforeUninstallApp(event) {
    await super.onBeforeUninstallApp(event);
    await this._stopRecordingIfExists();
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

    if (process.env.DETOX_INSTRUMENTS_PATH) {
      event.launchArgs['-instrumentsPath'] = process.env.DETOX_INSTRUMENTS_PATH;
    }

    if (this.testRecording) {
      event.launchArgs['-recordingPath'] = this.testRecording.temporaryRecordingPath;
    }
  }

  async onLaunchApp(event) {
    await super.onLaunchApp(event);

    if (this.testRecording) {
      await this.testRecording.start({ dry: true }); // start nominally, to set a correct recording state
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
