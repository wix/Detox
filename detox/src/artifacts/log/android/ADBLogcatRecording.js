const DetoxRuntimeError = require('../../../errors/DetoxRuntimeError');
const { interruptProcess } = require('../../../utils/childProcess');
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
    this.adb = adb.bind({ deviceId });

    this.deviceId = deviceId;
    this.pid = pid;
    this.since = since;

    this.pathToLogOnDevice = pathToLogOnDevice;
    this.processPromise = null;

    this._waitUntilLogFileIsCreated = null;
  }

  async doStart() {
    const pid = this.pid.get();

    this.processPromise = this.adb.logcat({
      file: this.pathToLogOnDevice,
      time: this.since.get(),
      pid: pid > 0 ? pid : 0,
    });

    this._waitUntilLogFileIsCreated = sleep(300).then(() => {
      return retry(() => this._assertLogIsCreated());
    });
  }

  async doStop() {
    try {
      await this._waitUntilLogFileIsCreated;
      this.since.set(await this.adb.now());
    } finally {
      if (this.processPromise) {
        await interruptProcess(this.processPromise);
        this.processPromise = null;
      }
    }
  }

  async doSave(artifactPath) {
    await this.adb.pull(this.pathToLogOnDevice, artifactPath);
    await this.adb.rm(this.pathToLogOnDevice);
  }

  async doDiscard() {
    await this.adb.rm(this.pathToLogOnDevice);
  }

  async _assertLogIsCreated() {
    const size = await this.adb.getFileSize(this.pathToLogOnDevice);

    if (size < 0) {
      throw new DetoxRuntimeError({
        message: `The log is not being recorded on device (${this.deviceId}) at path: ${this.pathToLogOnDevice}`,
      });
    }
  }
}

module.exports = ADBLogcatRecording;
