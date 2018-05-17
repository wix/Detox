const fs = require('fs-extra');

class AppleSimUtilsScreenshotHandle {
  constructor(config) {
    this.artifactPath = config.artifactPath;
    this.temporaryFilePath = config.temporaryFilePath;
  }

  async save() {
    await fs.ensureFile(this.artifactPath);
    await fs.move(this.temporaryFilePath, this.artifactPath, { overwrite: true });
  }

  async discard() {
    await fs.remove(this.temporaryFilePath);
  }
}

module.exports = AppleSimUtilsScreenshotHandle;