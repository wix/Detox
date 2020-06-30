const InstrumentsArtifactPlugin = require('../InstrumentsArtifactPlugin');
const AndroidInstrumentsRecording = require('./AndroidInstrumentsRecording');

class AndroidInstrumentsPlugin extends InstrumentsArtifactPlugin {
  constructor({ api, adb, client, devicePathBuilder }) {
    super({ api });

    this.adb = adb;
    this.client = client;
    this.devicePathBuilder = devicePathBuilder;
  }

  async onBeforeLaunchApp(event) {
    await super.onBeforeLaunchApp(event);

    if (this.testRecording) {
      event.launchArgs['detoxInstrumRecPath'] = this.testRecording.temporaryRecordingPath;
      if (this.api.userConfig.samplingInterval) {
        event.launchArgs['detoxInstrumSamplingInterval'] = this.api.userConfig.samplingInterval;
      }
    }
  }

  async preparePathForTestArtifact(testSummary) {
    return this.api.preparePathForArtifact('test.dtxplain', testSummary);
  }

  createTestRecording() {
    return new AndroidInstrumentsRecording({
      adb: this.adb,
      pluginContext: this.context,
      client: this.client,
      deviceId: this.context.deviceId,
      userConfig: this.api.userConfig,
      temporaryRecordingPath: this.devicePathBuilder.buildTemporaryArtifactPath('.dtxplain'),
    });
  }
}

module.exports = AndroidInstrumentsPlugin;
