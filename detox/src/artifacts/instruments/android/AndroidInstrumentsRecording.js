// @ts-nocheck
const InstrumentsArtifactRecording = require('../InstrumentsArtifactRecording');

class AndroidInstrumentsRecording extends InstrumentsArtifactRecording {
  constructor({ adb, pluginContext, device, deviceId, userConfig, temporaryRecordingPath }) {
    super({ pluginContext, device, userConfig, temporaryRecordingPath });
    this.adb = adb;
    this.deviceId = deviceId;
  }

  async doSave(artifactPath) {
    await super.doSave(artifactPath);
    // TODO Delegate this to a device action! Side-note: This would also make deviceId unnecessary here, as should be
    await this.adb.pull(this.deviceId, this.temporaryRecordingPath, artifactPath);
    await this.adb.rm(this.deviceId, this.temporaryRecordingPath, true);
  }

  async doDiscard() {
    // TODO Delegate this to a device action!
    await this.adb.rm(this.deviceId, this.temporaryRecordingPath, true);
  }
}

module.exports = AndroidInstrumentsRecording;
