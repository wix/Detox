const fs = require('fs-extra');

class AppleSimUtilsVideoRecording {
  constructor(config) {
    this.appleSimUtils = config.appleSimUtils;
    this.artifactPath = config.artifactPath;
    this.udid = config.udid;
    this.processPromise = null;
    this.process = null;
  }

  async start() {
    await fs.ensureFile(mp4ArtifactPath);
    this.processPromise = this.appleSimUtils.recordVideo(this.udid, this.artifactPath);
    this.process = this.processPromise.childProcess;
  }

  async stop() {
    this.process.kill('SIGINT');
    await this.processPromise;
  }

  async save() {}

  async discard() {
    await fs.remove(this.artifactPath);
  }
}

module.exports = AppleSimUtilsVideoRecording;