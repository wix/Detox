const fs = require('fs-extra');

class ADBScreenshotHandle {
  constructor(config) {
    this.adb = config.adb;
    this.artifactPath = config.artifactPath;
    this.deviceId = config.deviceId;
    this.pathToScreenshotOnDevice = config.pathToScreenshotOnDevice;
  }

  async save() {
    await fs.ensureFile(this.artifactPath);
    await this.adb.pull(this.deviceId, this.pathToScreenshotOnDevice, this.artifactPath);
    await this.adb.rm(this.deviceId, this.pathToScreenshotOnDevice);
  }

  async discard() {
    await this.adb.rm(this.deviceId, this.pathToScreenshotOnDevice);
  }
}

module.exports = ADBScreenshotHandle;
