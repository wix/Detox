const fs = require('fs-extra');
const SnapshotArtifact = require('../core/SnapshotArtifact');

class SimulatorScreenshot extends SnapshotArtifact {
  constructor(config) {
    super();
    this.artifactPath = config.artifactPath;
    this.temporaryFilePath = config.temporaryFilePath;
  }

  async doCreate() {
    await fs.ensureFile(this.temporaryFilePath);
    await this.appleSimUtils.takeScreenshot(this.udid, this.temporaryFilePath);
  }

  async doSave() {
    await fs.ensureFile(this.artifactPath);
    await fs.move(this.temporaryFilePath, this.artifactPath, { overwrite: true });
  }

  async doDiscard() {
    await fs.remove(this.temporaryFilePath);
  }
}

module.exports = SimulatorScreenshot;