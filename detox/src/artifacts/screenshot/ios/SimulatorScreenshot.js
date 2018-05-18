const fs = require('fs-extra');
const ensureExtension = require('../../../utils/ensureExtension');
const SnapshotArtifact = require('../../core/artifact/SnapshotArtifact');

class SimulatorScreenshot extends SnapshotArtifact {
  constructor(config) {
    super();
    this.temporaryFilePath = config.temporaryFilePath;
  }

  async doCreate() {
    await fs.ensureFile(this.temporaryFilePath);
    await this.appleSimUtils.takeScreenshot(this.udid, this.temporaryFilePath);
  }

  async doSave(artifactPath) {
    const pngArtifactPath = ensureExtension(artifactPath, '.png');

    await fs.ensureFile(pngArtifactPath);
    await fs.move(this.temporaryFilePath, pngArtifactPath, { overwrite: true });
  }

  async doDiscard() {
    await fs.remove(this.temporaryFilePath);
  }
}

module.exports = SimulatorScreenshot;