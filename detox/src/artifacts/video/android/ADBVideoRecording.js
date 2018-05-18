const fs = require('fs-extra');
const ensureExtension = require('../../../utils/ensureExtension');
const sleep = require('../../../utils/sleep');
const RecordingArtifact = require('../../core/artifact/RecordingArtifact');

class ADBVideoRecording extends RecordingArtifact {
  constructor(config) {
    super();

    this.adb = config.adb;
    this.deviceId = config.deviceId;
    this.pathToVideoOnDevice = config.pathToVideoOnDevice;
    this.screenRecordOptions = { ...config.screenRecordOptions };

    this.processPromise = null;
    this.process = null;
  }

  async doStart() {
    this.processPromise = this.adb.screenrecord(this.deviceId, {
      ...this.screenRecordOptions,
      path: this.pathToVideoOnDevice
    });

    this.process = this.processPromise.childProcess;
    await this._delayWhileVideoFileIsEmpty();
  }

  async doStop() {
    this.process.kill('SIGINT');

    await this.processPromise.catch(e => {
      if (e.exitCode == null && e.childProcess.killed) {
        return;
      }

      throw e;
    });
  }

  async doSave(artifactPath) {
    const mp4ArtifactPath = ensureExtension(artifactPath, '.mp4');

    await this._delayWhileVideoFileIsBusy();
    await fs.ensureFileSync(mp4ArtifactPath);
    await this.adb.pull(this.deviceId, this.pathToVideoOnDevice, mp4ArtifactPath);
    await this.adb.rm(this.deviceId, this.pathToVideoOnDevice);
  }

  async doDiscard() {
    await this._delayWhileVideoFileIsBusy();
    await this.adb.rm(this.deviceId, this.pathToVideoOnDevice);
  }

  async _delayWhileVideoFileIsEmpty() {
    let size = -1;

    do {
      await sleep(300);
      size = await this._getVideoFileSizeOnDevice();
    } while (size < 1);
  }

  async _getVideoFileSizeOnDevice() {
    const { stdout, stderr } = await this.adb.adbCmd(this.deviceId, 'shell wc -c ' + this.pathToVideoOnDevice).catch(e => e);

    if (stderr.includes('No such file or directory')) {
      return -1;
    }

    return Number(stdout.slice(0, stdout.indexOf(' ')));
  }

  async _delayWhileVideoFileIsBusy() {
    let busy = true;

    do {
      await sleep(500);
      busy = await this._isVideoFileOnDeviceBusy();
    } while (busy);
  }

  async _isVideoFileOnDeviceBusy() {
    const output = await this.adb.shell(this.deviceId, 'lsof ' + this.pathToVideoOnDevice);
    return output.length > 0;
  }
}

module.exports = ADBVideoRecording;