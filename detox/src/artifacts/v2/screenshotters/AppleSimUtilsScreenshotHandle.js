const fs = require('fs-extra');

class AppleSimUtilsScreenshotHandle {
  constructor(config) {
    this.artifactPath = config.artifactPath;
  }

  async save() {}

  async discard() {
    await fs.remove(this.artifactPath);
  }
}

module.exports = AppleSimUtilsScreenshotHandle;