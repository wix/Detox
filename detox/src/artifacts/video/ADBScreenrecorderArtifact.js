const DetoxRuntimeError = require('../../errors/DetoxRuntimeError');
const interruptProcess = require('../../utils/interruptProcess');
const retry = require('../../utils/retry');
const sleep = require('../../utils/sleep');
const Artifact = require('../templates/artifact/Artifact');

class ADBVideoRecording extends Artifact {
  constructor(config) {
    super(config);

    this.adb = config.adb;
    this.deviceId = config.deviceId;
    this.pathToVideoOnDevice = config.pathToVideoOnDevice;
    this.screenRecordOptions = config.screenRecordOptions || {};

    this.processPromise = null;
    this._waitWhileVideoIsBusy = null;
  }

  async doStart() {
    this.processPromise = this.adb.screenrecord(this.deviceId, {
      ...this.screenRecordOptions,
      path: this.pathToVideoOnDevice
    });

    await sleep(300); // wait while video is most likely empty
    await retry(() => this._assertVideoIsBeingRecorded());
  }

  async doStop() {
    if (this.processPromise) {
      await interruptProcess(this.processPromise);
      this.processPromise = null;

      this._waitWhileVideoIsBusy = sleep(500).then(() => {
        return retry(() => this._assertVideoIsNotOpenedByProcesses());
      });
    }
  }

  async doSave(artifactPath) {
    await this._waitWhileVideoIsBusy;
    await this.adb.pull(this.deviceId, this.pathToVideoOnDevice, artifactPath);
    await this.adb.rm(this.deviceId, this.pathToVideoOnDevice);
  }

  async doDiscard() {
    await this._waitWhileVideoIsBusy;
    await this.adb.rm(this.deviceId, this.pathToVideoOnDevice);
  }

  async _assertVideoIsBeingRecorded() {
    const size = await this.adb.getFileSize(this.deviceId, this.pathToVideoOnDevice);

    if (size < 1) {
      throw new DetoxRuntimeError({
        message: `The video is not being recorded on device (${this.deviceId}) at path: ${this.pathToVideoOnDevice}`,
      });
    }
  }

  async _assertVideoIsNotOpenedByProcesses() {
    const size = await this.adb.getFileSize(this.deviceId, this.pathToVideoOnDevice);

    if (size < 1) {
      throw new DetoxRuntimeError({
        message: `The video is not being recorded on device (${this.deviceId}) at path: ${this.pathToVideoOnDevice}`,
      });
    }
  }
}

module.exports = ADBVideoRecording;