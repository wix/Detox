const fs = require('fs-extra');
const RecordingArtifact = require('../../core/artifact/RecordingArtifact');
const ensureMove = require('../../../utils/ensureMove');
const interruptProcess = require('../../../utils/interruptProcess');

class SimulatorVideoRecording extends RecordingArtifact {
  constructor(config) {
    super();
    this.appleSimUtils = config.appleSimUtils;
    this.temporaryFilePath = config.temporaryFilePath;
    this.udid = config.udid;
    this.processPromise = null;
  }

  async doStart() {
    await fs.ensureFile(this.temporaryFilePath);
    this.processPromise = this.appleSimUtils.recordVideo(this.udid, this.temporaryFilePath);
    this.process = this.processPromise.childProcess;
  }

  async doStop() {
    if (this.processPromise) {
      await interruptProcess(this.processPromise);
    }
  }

  async doSave(artifactPath) {
    await ensureMove(this.temporaryFilePath, artifactPath, '.mp4');
  }

  async doDiscard() {
    await fs.remove(this.temporaryFilePath);
  }
}

module.exports = SimulatorVideoRecording;