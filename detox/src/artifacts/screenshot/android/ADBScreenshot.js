const fs = require('fs-extra');
const ensureExtension = require('../../../utils/ensureExtension');
const SnapshotArtifact = require('../../core/artifact/SnapshotArtifact');

class ADBScreenshot extends SnapshotArtifact {
  constructor(config) {
    super();

    this.adb = config.adb;
    this.deviceId = config.deviceId;
    this.pathToScreenshotOnDevice = config.pathToScreenshotOnDevice;
  }

  async doCreate() {
    await this.adb.screencap(this.deviceId, this.pathToScreenshotOnDevice);
  }

  async doSave(artifactPath) {
    const pngArtifactPath = ensureExtension(artifactPath, '.png');

    await fs.ensureFile(pngArtifactPath);
    await this.adb.pull(this.deviceId, this.pathToScreenshotOnDevice, pngArtifactPath);
    await this.adb.rm(this.deviceId, this.pathToScreenshotOnDevice);
  }

  async doDiscard() {
    await this.adb.rm(this.deviceId, this.pathToScreenshotOnDevice);
  }
}

module.exports = ADBScreenshot;
