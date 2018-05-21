const fs = require('fs-extra');
const RecordingArtifact = require('../../core/artifact/RecordingArtifact');
const ensureExtension = require('../../../utils/ensureExtension');
const interruptProcess = require('../../../utils/interruptProcess');
const {spawn} = require('child-process-promise');

class ADBLogcatRecording extends RecordingArtifact {
  constructor({
    adb,
    bundleId,
    deviceId,
    pathToLogOnDevice,
  }) {
    super();

    this.adb = adb;
    this.bundleId = bundleId;
    this.deviceId = deviceId;
    this.pathToLogOnDevice = pathToLogOnDevice;
    this.processPromise = null;
  }

  async doStart() {
    const now = await this.adb.shell(this.deviceId, `date "+\\"%Y-%m-%d %T.000\\""`);

    this.processPromise = this.adb.logcat(this.deviceId, {
      file: this.pathToLogOnDevice,
      time: now,
    });

    await this.adb.waitForFileRecording(this.deviceId, this.pathToLogOnDevice, false);
  }

  async doStop() {
    if (this.processPromise) {
      await interruptProcess(this.processPromise, 'SIGTERM');
    }
  }

  async doSave(artifactPath) {
    const logArtifactPath = ensureExtension(artifactPath, '.log');

    await fs.ensureFile(logArtifactPath);
    await this.adb.waitForFileRelease(this.deviceId, this.pathToLogOnDevice);
    await this.adb.pull(this.deviceId, this.pathToLogOnDevice, logArtifactPath);
    await this.adb.rm(this.deviceId, this.pathToLogOnDevice);
  }

  async doDiscard() {
    await this.adb.waitForFileRelease(this.deviceId, this.pathToLogOnDevice);
    await this.adb.rm(this.deviceId, this.pathToLogOnDevice);
  }
}

module.exports = ADBLogcatRecording;