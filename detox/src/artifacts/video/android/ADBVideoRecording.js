const fs = require('fs-extra');
const RecordingArtifact = require('../../core/artifact/RecordingArtifact');
const ensureExtension = require('../../../utils/ensureExtension');
const interruptProcess = require('../../../utils/interruptProcess');
const sleep = require('../../../utils/sleep');

class ADBVideoRecording extends RecordingArtifact {
  constructor(config) {
    super();

    this.adb = config.adb;
    this.deviceId = config.deviceId;
    this.pathToVideoOnDevice = config.pathToVideoOnDevice;
    this.screenRecordOptions = { ...config.screenRecordOptions };

    this.processPromise = null;
    this.waitWhileVideoIsMostLikelyBusy = null;
  }

  async doStart() {
    this.processPromise = this.adb.screenrecord(this.deviceId, {
      ...this.screenRecordOptions,
      path: this.pathToVideoOnDevice
    });

    await this._delayWhileVideoFileIsEmpty();
  }

  async doStop() {
    if (this.processPromise) {
      await interruptProcess(this.processPromise);
      this.waitWhileVideoIsMostLikelyBusy = sleep(500);
    }
  }

  async doSave(artifactPath) {
    const mp4ArtifactPath = ensureExtension(artifactPath, '.mp4');

    await this._delayWhileVideoFileIsBusy();
    await fs.ensureFile(mp4ArtifactPath);
    await this.adb.pull(this.deviceId, this.pathToVideoOnDevice, mp4ArtifactPath);
    await this.adb.rm(this.deviceId, this.pathToVideoOnDevice);
  }

  async doDiscard() {
    await this._delayWhileVideoFileIsBusy();
    await this.adb.rm(this.deviceId, this.pathToVideoOnDevice);
  }

  async _delayWhileVideoFileIsEmpty() {
    await sleep(300); // wait while video is most likely empty
    await this._waitForFileRecording();
  }

  async _delayWhileVideoFileIsBusy() {
    await this.waitWhileVideoIsMostLikelyBusy;
    await this._waitForFileRelease();
  }

  async _waitForFileRecording() {
    let size;

    do {
      size = await this.adb.getFileSize(this.deviceId, this.pathToVideoOnDevice);
      await sleep(100);
    } while (size < 1);
  }

  async _waitForFileRelease() {
    let isFileOpen;

    do {
      isFileOpen = await this.adb.isFileOpen(this.deviceId, this.pathToVideoOnDevice);
      await sleep(500);
    } while (isFileOpen);
  }
}

module.exports = ADBVideoRecording;