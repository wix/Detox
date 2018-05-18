const fs = require('fs-extra');
const RecordingArtifact = require('../core/RecordingArtifact');

class AppleSimUtilsVideoRecording extends RecordingArtifact {
  constructor(config) {
    super();
    this.appleSimUtils = config.appleSimUtils;
    this.artifactPath = config.artifactPath;
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

  async doSave() {
    await fs.ensureFile(this.artifactPath);
    await fs.move(this.temporaryFilePath, this.artifactPath, {
      overwrite: true
    });
  }

  async doDiscard() {
    await fs.remove(this.temporaryFilePath);
  }
}

module.exports = AppleSimUtilsVideoRecording;