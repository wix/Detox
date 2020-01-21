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
    }
  }

  async preparePathForTestArtifact(testSummary) {
    return this.api.preparePathForArtifact('test.dtxplain', testSummary);
  }

  createTestRecording() {
    return new AndroidInstrumentsRecording({
      adb: this.adb,
      client: this.client,
      deviceId: this.context.deviceId,
      temporaryRecordingPath: this.devicePathBuilder.buildTemporaryArtifactPath('.dtxplain'),
    });
  }
}

module.exports = AndroidInstrumentsPlugin;
