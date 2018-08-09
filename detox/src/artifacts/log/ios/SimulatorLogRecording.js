const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const log = require('../../../utils/logger').child({ __filename });
const sleep = require('../../../utils/sleep');
const exec = require('../../../utils/exec');
const Artifact = require('../../templates/artifact/Artifact');

const TAIL_SCRIPT = path.join(__dirname, 'SimulatorLogPlugin.sh');

class SimulatorLogRecording extends Artifact {
  constructor({
    logStderr,
    logStdout,
    temporaryLogPath,
  }) {
    super();

    this._logPath = temporaryLogPath;
    this._stdoutPath = logStdout;
    this._stderrPath = logStderr;
    this._tailProcess = null;
    this._minimumLifetime = Promise.resolve();
  }

  async doStart() {
    await fs.ensureFileSync(this._logPath);
    this._tailProcess = exec.spawnAndLog(TAIL_SCRIPT, [this._stdoutPath, this._stderrPath, this._logPath]);
    this._minimumLifetime = sleep(100);
  }

  async doStop() {
    if (this._tailProcess) {
      await Promise.race([this._tailProcess, this._minimumLifetime]);
      await exec.interruptProcess(this._tailProcess);
      await Promise.all([
        fs.truncate(this._stdoutPath).catch(this._onMissingLogError),
        fs.truncate(this._stderrPath).catch(this._onMissingLogError),
      ]);

      this._tailProcess = null;
    }
  }

  _onMissingLogError(e) {
    log.warn({ event: 'APP_LOG_MISSING' }, 'Was the simulator log unexpectedly deleted?\n' + e.message);
  }

  async doSave(artifactPath) {
    const tempLogPath = this._logPath;

    if (await fs.exists(tempLogPath)) {
      log.debug({ event: 'MOVE_FILE' }, `moving "${tempLogPath}" to ${artifactPath}`);
      await fs.move(tempLogPath, artifactPath);
    } else {
      log.error({ event: 'MOVE_FILE_ERROR'} , `did not find temporary log file: ${tempLogPath}`);
    }
  }

  async doDiscard() {
    await fs.remove(this._logPath);
  }
}

module.exports = SimulatorLogRecording;

