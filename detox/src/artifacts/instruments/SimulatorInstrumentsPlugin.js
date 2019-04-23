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
    this.enabled = false;
    this.shouldRecord = argparse.getArgValue('record-performance') === 'all';
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

    if (!this.enabled && this.shouldRecord) {
      const isInstalled = await this._assertDetoxInstrumentsInstalled(event.launchArgs['-instrumentsPath']);
      this.enabled = this.shouldRecord = isInstalled;
    }

    const isInsideRunningTest = !!this.context.testSummary;
    if (this.enabled && isInsideRunningTest && !this.testRecording) {
      this.testRecording = this.createTrackedTestRecording();
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

  async _assertDetoxInstrumentsInstalled(customInstrumentsPath) {
    const instrumentsPath = customInstrumentsPath || SimulatorInstrumentsPlugin.DEFAULT_INSTRUMENTS_PATH;
    if (await fs.exists(instrumentsPath)) {
      return true;
    }

    const hint = customInstrumentsPath
      ? `Please verify that -instrumentsPath argument points to the existing Detox Instruments installation.`
      : `To enable recording performance profiles, please follow: https://github.com/wix/DetoxInstruments#installation`;

    log.warn({ event: 'INSTRUMENTS_NOT_FOUND' },
      `Failed to find Detox Instruments app at path: ${instrumentsPath}\n${hint}`);

    return false;
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

SimulatorInstrumentsPlugin.DEFAULT_INSTRUMENTS_PATH = '/Applications/Detox Instruments.app';

module.exports = SimulatorInstrumentsPlugin;
