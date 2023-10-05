// @ts-nocheck
const fs = require('fs-extra');

const childProcess = require('../../../utils/childProcess');
const log = require('../../../utils/logger').child({ cat: 'artifact' });
const sleep = require('../../../utils/sleep');
const Artifact = require('../../templates/artifact/Artifact');
const FileArtifact = require('../../templates/artifact/FileArtifact');

class SimulatorLogRecording extends Artifact {
  constructor({
    udid,
    bundleId,
    appleSimUtils,
    temporaryLogPath,
    config,
  }) {
    super();

    this._udid = udid;
    this._bundleId = bundleId;
    this._appleSimUtils = appleSimUtils;
    this._logPath = temporaryLogPath;
    this._logContext = null;
    this._config = config;
  }

  async doStart({ udid, bundleId } = {}) {
    if (udid) {this._udid = udid; }
    if (bundleId) {this._bundleId = bundleId; }

    await fs.ensureFile(this._logPath);
    const fileHandle = await fs.open(this._logPath, 'a');

    this._logContext = {
      fileHandle,
      process: this._appleSimUtils.logStream({
        udid: this._udid,
        processImagePath: await this._getProcessImagePath(),
        stdout: fileHandle,
        level: 'debug',
        style: 'compact',
      }),
    };

    await sleep(this._config.delayAfterStart);
  }

  async doStop() {
    if (this._logContext) {
      const { fileHandle, process } = this._logContext;
      await sleep(this._config.delayBeforeStop);
      await this._tryInterruptProcessGracefully(process);
      await fs.close(fileHandle);
      this._logContext = null;
    }
  }

  async _tryInterruptProcessGracefully(process) {
    await childProcess.interruptProcess(process, {
      SIGINT: 0,
      SIGTERM: this._config.delayBeforeSigterm,
    });
  }

  async doSave(artifactPath) {
    await FileArtifact.moveTemporaryFile(log, this._logPath, artifactPath);
  }

  async doDiscard() {
    await fs.remove(this._logPath);
  }

  async _getProcessImagePath() {
    return this._bundleId
      ? this._appleSimUtils.getAppContainer(this._udid, this._bundleId)
      : '';
  }
}

module.exports = SimulatorLogRecording;

