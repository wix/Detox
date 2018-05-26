const DetoxRuntimeError = require('../../../errors/DetoxRuntimeError');
const interruptProcess = require('../../../utils/interruptProcess');
const retry = require('../../../utils/retry');
const sleep = require('../../../utils/sleep');

class ADBLogcatRecording {
  constructor({
    adb,
    deviceId,
    pid,
    pathToLogOnDevice,
  }) {
    this.adb = adb;

    this.deviceId = deviceId;
    this.pid = pid;

    this.pathToLogOnDevice = pathToLogOnDevice;
    this.processPromise = null;

    this._waitUntilLogFileIsCreated = null;
    this._waitWhileLogIsOpenedByLogcat = null;
  }

  async start() {
    const now = await this.adb.shell(this.deviceId, `date "+\\"%Y-%m-%d %T.000\\""`);

    this.processPromise = this.adb.logcat(this.deviceId, {
      file: this.pathToLogOnDevice,
      pid: this.pid,
      time: now,
    });

    this._waitUntilLogFileIsCreated = sleep(300).then(() => {
      return retry(() => this._assertLogIsCreated());
    });
  }

  async restart({ pid }) {
    if (this.processPromise) {
      await this.stop();
    }

    this.pid = pid;
    await this.start();
  }

  async stop() {
    try {
      await this._waitUntilLogFileIsCreated;
    } finally {
      if (this.processPromise) {
        await interruptProcess(this.processPromise);
        this.processPromise = null;

        this._waitWhileLogIsOpenedByLogcat = sleep(300).then(() => {
          return retry(() => this._assertLogIsNotOpenedByApps());
        });
      }
    }
  }

  async save(artifactPath) {
    await this._waitWhileLogIsOpenedByLogcat;
    await this.adb.pull(this.deviceId, this.pathToLogOnDevice, artifactPath);
    await this.adb.rm(this.deviceId, this.pathToLogOnDevice);
  }

  async discard() {
    await this._waitWhileLogIsOpenedByLogcat;
    await this.adb.rm(this.deviceId, this.pathToLogOnDevice);
  }

  async _assertLogIsCreated() {
    const size = await this.adb.getFileSize(this.deviceId, this.pathToLogOnDevice);

    if (size < 0) {
      throw new DetoxRuntimeError({
        message: `The log is not being recorded on device (${this.deviceId}) at path: ${this.pathToLogOnDevice}`,
      });
    }
  }

  async _assertLogIsNotOpenedByApps() {
    const isFileOpen = await this.adb.isFileOpen(this.deviceId, this.pathToLogOnDevice);

    if (isFileOpen) {
      throw new DetoxRuntimeError({
        message: `The log is still being opened on device (${this.deviceId}) at path: ${this.pathToLogOnDevice}`,
      });
    }
  }
}

module.exports = ADBLogcatRecording;