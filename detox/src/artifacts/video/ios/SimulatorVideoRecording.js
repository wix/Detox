const fs = require('fs-extra');
const ensureExtension = require('../../../utils/ensureExtension');
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
    await this.processPromise;
  }

  async doSave(artifactPath) {
    const mp4ArtifactPath = ensureExtension(artifactPath, '.mp4');

    await fs.ensureFile(mp4ArtifactPath);
    await fs.move(this.temporaryFilePath, mp4ArtifactPath, {
      overwrite: true
    });
  }

  async doDiscard() {
    await fs.remove(this.temporaryFilePath);
  }
}

module.exports = AppleSimUtilsVideoRecording;