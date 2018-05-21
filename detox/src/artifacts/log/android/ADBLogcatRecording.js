const fs = require('fs-extra');
const RecordingArtifact = require('../../core/artifact/RecordingArtifact');
const ensureExtension = require('../../../utils/ensureExtension');
const interruptProcess = require('../../../utils/interruptProcess');
const sleep = require('../../../utils/sleep');

class ADBLogcatRecording extends RecordingArtifact {
  constructor({
    adb,
    deviceId,
    pathToLogOnDevice,
    processId,
  }) {
    super();

    this.adb = adb;
    this.deviceId = deviceId;
    this.pathToLogOnDevice = pathToLogOnDevice;
    this.processId = processId;
    this.processPromise = null;
  }

  async doStart() {
    const now = await this.adb.shell(this.deviceId, `date "+\\"%Y-%m-%d %T.000\\""`);

    this.processPromise = this.adb.logcat(this.deviceId, {
      file: this.pathToLogOnDevice,
      pid: this.processId,
      time: now,
    });

    await this._waitUntilLogFileIsCreated();
  }

  async doStop() {
    if (this.processPromise) {
      await interruptProcess(this.processPromise);
    }
  }

  async doSave(artifactPath) {
    const logArtifactPath = ensureExtension(artifactPath, '.log');

    await fs.ensureFile(logArtifactPath);
    await this._waitWhileLogIsOpenedByLogcat();
    await this.adb.pull(this.deviceId, this.pathToLogOnDevice, logArtifactPath);
    await this.adb.rm(this.deviceId, this.pathToLogOnDevice);
  }

  async doDiscard() {
    await this._waitWhileLogIsOpenedByLogcat();
    await this.adb.rm(this.deviceId, this.pathToLogOnDevice);
  }

  async _waitUntilLogFileIsCreated() {
    let size;

    do {
      size = await this.adb.getFileSize(this.deviceId, this.pathToLogOnDevice);
      await sleep(100);
    } while (size === -1);
  }

  async _waitWhileLogIsOpenedByLogcat() {
    let isFileOpen;

    do {
      isFileOpen = await this.adb.isFileOpen(this.deviceId, this.pathToLogOnDevice);
      await sleep(500);
    } while (isFileOpen);
  }
}

module.exports = ADBLogcatRecording;