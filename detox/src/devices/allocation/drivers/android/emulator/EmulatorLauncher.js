// @ts-nocheck
const { DetoxRuntimeError } = require('../../../../../errors');
const retry = require('../../../../../utils/retry');
const { LaunchCommand } = require('../../../../common/drivers/android/emulator/exec/EmulatorExec');

const { launchEmulatorProcess } = require('./launchEmulatorProcess');

const isUnknownEmulatorError = (err) => (err.message || '').includes('failed with code null');

class EmulatorLauncher {
  constructor({ adb, emulatorExec }) {
    this._adb = adb;
    this._emulatorExec = emulatorExec;
  }

  /**
   * @param {object} options
   * @param {string} options.avdName
   * @param {string} options.adbName
   * @param {number} options.port
   * @param {string | undefined} options.bootArgs
   * @param {string | undefined} options.gpuMode
   * @param {boolean} options.headless
   * @param {boolean} options.readonly
   */
  async launch(options) {
    const launchCommand = new LaunchCommand(options);
    await retry({
      retries: 2,
      interval: 100,
      conditionFn: isUnknownEmulatorError,
    }, () => launchEmulatorProcess(this._emulatorExec, this._adb, launchCommand));
  }

  /**
   * @param {string} adbName
   */
  async awaitEmulatorBoot(adbName) {
    await retry({ retries: 240, interval: 2500, shouldUnref: true }, async () => {
      const isBootComplete = await this._adb.isBootComplete(adbName);

      if (!isBootComplete) {
        throw new DetoxRuntimeError({
          message: `Waited for ${adbName} to complete booting for too long!`,
        });
      }
    });
  }

  async shutdown(adbName) {
    await this._adb.emuKill(adbName);
    await retry({
      retries: 5,
      interval: 1000,
      initialSleep: 2000,
    }, async () => {
      if (await this._adb.getState(adbName) !== 'none') {
        throw new DetoxRuntimeError({
          message: `Failed to shut down the emulator ${adbName}`,
          hint: `Try terminating manually all processes named "qemu-system-x86_64"`,
        });
      }
    });
  }
}

module.exports = EmulatorLauncher;
