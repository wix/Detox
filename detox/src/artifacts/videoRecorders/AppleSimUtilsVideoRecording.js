const fs = require('fs-extra');
const sleep = require('../../utils/sleep');

class AppleSimUtilsVideoRecording {
  constructor(config) {
    this.appleSimUtils = config.appleSimUtils;
    this.artifactPath = config.artifactPath;
    this.temporaryFilePath = config.temporaryFilePath;
    this.udid = config.udid;
    this.processPromise = null;
    this.process = null;
  }

  async start() {
    await fs.ensureFile(this.temporaryFilePath);
    this.processPromise = this.appleSimUtils.recordVideo(this.udid, this.temporaryFilePath);
    this.process = this.processPromise.childProcess;

    await this._avoidAbruptVideoBeginning();
  }

  async stop() {
    if (!this.process) {
      return;
    }

    await this._avoidAbruptVideoEnding();

    this.process.kill('SIGINT');
    await this.processPromise;
  }

  async _avoidAbruptVideoBeginning() {
    await sleep(500);
  }

  async _avoidAbruptVideoEnding() {
    await sleep(500);
  }

  async save() {
    await fs.ensureFile(this.artifactPath);
    await fs.move(this.temporaryFilePath, this.artifactPath, {
      overwrite: true
    });
  }

  async discard() {
    await fs.remove(this.temporaryFilePath);
  }
}

module.exports = AppleSimUtilsVideoRecording;