const DetoxRuntimeError = require('../../../errors/DetoxRuntimeError');
const { interruptProcess } = require('../../../utils/exec');
const log = require('../../../utils/logger').child({ __filename });
const retry = require('../../../utils/retry');
const sleep = require('../../../utils/sleep');
const Artifact = require('../../templates/artifact/Artifact');

class ADBLogcatRecording extends Artifact {
  constructor({
    adb,
    deviceId,
    pid,
    since,
    pathToLogOnDevice,
  }) {
    super();
    this.adb = adb;

    this.deviceId = deviceId;
    this.pid = pid;
    this.since = since;

    this.pathToLogOnDevice = pathToLogOnDevice;
    this.processPromise = null;

    this._waitUntilLogFileIsCreated = null;
  }

  get hasRecordedFile() {
    return !!this._waitUntilLogFileIsCreated;
  }

  async doStart() {
    const pid = this.pid.get();

    if (pid > 0) {
      this.processPromise = this.adb.logcat(this.deviceId, {
        file: this.pathToLogOnDevice,
        time: this.since.get(),
        pid,
      });

      this._waitUntilLogFileIsCreated = sleep(300).then(() => {
        return retry(() => this._assertLogIsCreated());
      });
    } else {
      log.debug('Ignoring a command to start recording, because PID of the app is missing');
    }
  }

  async doStop() {
    try {
      await this._waitUntilLogFileIsCreated;
      this.since.set(await this.adb.now(this.deviceId));
    } finally {
      if (this.processPromise) {
        await interruptProcess(this.processPromise);
        this.processPromise = null;
      }
    }
  }

  async doSave(artifactPath) {
    if (this.hasRecordedFile) {
      await this.adb.pull(this.deviceId, this.pathToLogOnDevice, artifactPath);
      await this.adb.rm(this.deviceId, this.pathToLogOnDevice);
    } else {
      log.debug(`Skipping saving artifact because the recording has not started: ${artifactPath}`);
    }
  }

  async doDiscard() {
    if (this.hasRecordedFile) {
      await this.adb.rm(this.deviceId, this.pathToLogOnDevice);
    } else {
      log.debug(`Skipping discarding artifact due to a not started recording: ${this.pathToLogOnDevice}`);
    }
  }

  async _assertLogIsCreated() {
    const size = await this.adb.getFileSize(this.deviceId, this.pathToLogOnDevice);

    if (size < 0) {
      throw new DetoxRuntimeError({
        message: `The log is not being recorded on device (${this.deviceId}) at path: ${this.pathToLogOnDevice}`,
      });
    }
  }
}

module.exports = ADBLogcatRecording;
