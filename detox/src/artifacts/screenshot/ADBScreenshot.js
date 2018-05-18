const fs = require('fs-extra');
const SnapshotArtifact = require('../core/SnapshotArtifact');

class ADBScreenshot extends SnapshotArtifact {
  constructor(config) {
    super();

    this.adb = config.adb;
    this.deviceId = config.deviceId;

    this.artifactPath = config.artifactPath;
    this.pathToScreenshotOnDevice = config.pathToScreenshotOnDevice;
  }

  async doCreate() {
    await this.adb.screencap(this.deviceId, this.pathToScreenshotOnDevice);
  }

  async doSave() {
    await fs.ensureFile(this.artifactPath);
    await this.adb.pull(this.deviceId, this.pathToScreenshotOnDevice, this.artifactPath);
    await this.adb.rm(this.deviceId, this.pathToScreenshotOnDevice);
  }

  async doDiscard() {
    await this.adb.rm(this.deviceId, this.pathToScreenshotOnDevice);
  }
}

module.exports = ADBScreenshot;
