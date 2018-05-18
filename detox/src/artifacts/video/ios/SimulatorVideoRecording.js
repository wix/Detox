const fs = require('fs-extra');
const ensureMove = require('../../../utils/ensureMove');
const RecordingArtifact = require('../../core/artifact/RecordingArtifact');

class AppleSimUtilsVideoRecording extends RecordingArtifact {
  constructor(config) {
    super();
    this.appleSimUtils = config.appleSimUtils;
    this.temporaryFilePath = config.temporaryFilePath;
    this.udid = config.udid;
    this.processPromise = null;
    this.process = null;
  }

  async doStart() {
    await fs.ensureFile(this.temporaryFilePath);
    this.processPromise = this.appleSimUtils.recordVideo(this.udid, this.temporaryFilePath);
    this.process = this.processPromise.childProcess;
  }

  async doStop() {
    if (!this.process) {
      return;
    }

    this.process.kill('SIGINT');
    await this.processPromise.catch(e => {
      if (e.exitCode == null && e.childProcess.killed) {
        return;
      }

      throw e;
    });
  }

  async doSave(artifactPath) {
    await ensureMove(this.temporaryFilePath, artifactPath, '.mp4');
  }

  async doDiscard() {
    await fs.remove(this.temporaryFilePath);
  }
}

module.exports = AppleSimUtilsVideoRecording;