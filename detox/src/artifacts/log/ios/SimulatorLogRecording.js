const fs = require('fs-extra');
const log = require('../../../utils/logger').child({ __filename });
const sleep = require('../../../utils/sleep');
const exec = require('../../../utils/exec');
const Artifact = require('../../templates/artifact/Artifact');

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
    const graceful = await Promise.race([
      sleep(this._config.delayBeforeSigterm).then(() => false),
      exec.interruptProcess(process, 'SIGINT').then(() => true),
    ]);

    if (!graceful) {
      await exec.interruptProcess(process, 'SIGTERM');
    }
  }

  async doSave(artifactPath) {
    await Artifact.moveTemporaryFile(log, this._logPath, artifactPath);
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

