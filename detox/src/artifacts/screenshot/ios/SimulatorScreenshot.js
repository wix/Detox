const fs = require('fs-extra');
const ensureMove = require('../../../utils/ensureMove');
const SnapshotArtifact = require('../../core/artifact/SnapshotArtifact');

class SimulatorScreenshot extends SnapshotArtifact {
  constructor(config) {
    super();
    this.appleSimUtils = config.appleSimUtils;
    this.udid = config.udid;
    this.temporaryFilePath = config.temporaryFilePath;
  }

  async doCreate() {
    await fs.ensureFile(this.temporaryFilePath);
    await this.appleSimUtils.takeScreenshot(this.udid, this.temporaryFilePath);
  }

  async doSave(artifactPath) {
    await ensureMove(this.temporaryFilePath, artifactPath, '.png');
  }

  async doDiscard() {
    await fs.remove(this.temporaryFilePath);
  }
}

module.exports = SimulatorScreenshot;