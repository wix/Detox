const InstrumentsArtifactRecording = require('../InstrumentsArtifactRecording');

class AndroidInstrumentsRecording extends InstrumentsArtifactRecording {
  constructor({ adb, pluginContext, client, deviceId, userConfig, temporaryRecordingPath }) {
    super({ pluginContext, client, userConfig, temporaryRecordingPath });
    this.adb = adb;
    this.deviceId = deviceId;
  }

  async doSave(artifactPath) {
    await super.doSave(artifactPath);
    await this.adb.pull(this.deviceId, this.temporaryRecordingPath, artifactPath);
    await this.adb.rm(this.deviceId, this.temporaryRecordingPath, true);
  }

  async doDiscard() {
    await this.adb.rm(this.deviceId, this.temporaryRecordingPath, true);
  }
}

module.exports = AndroidInstrumentsRecording;
