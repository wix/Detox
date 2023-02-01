// @ts-nocheck
const { DetoxRuntimeError } = require('../../../../../errors');
const log = require('../../../../../utils/logger').child({ cat: 'device' });
const retry = require('../../../../../utils/retry');
const traceMethods = require('../../../../../utils/traceMethods');
const DeviceLauncher = require('../../../../common/drivers/DeviceLauncher');
const { LaunchCommand } = require('../../../../common/drivers/android/emulator/exec/EmulatorExec');

const { launchEmulatorProcess } = require('./launchEmulatorProcess');

const isUnknownEmulatorError = (err) => (err.message || '').includes('failed with code null');

class EmulatorLauncher extends DeviceLauncher {
  constructor({ adb, emulatorExec, eventEmitter }) {
    super(eventEmitter);
    this._adb = adb;
    this._emulatorExec = emulatorExec;
    traceMethods(log, this, ['_awaitEmulatorBoot']);
  }

  /**
   * @param avdName { String }
   * @param adbName { String }
   * @param isRunning { Boolean }
   * @param options { Object }
   * @param options.port { Number | undefined }
   * @param options.bootArgs { String | undefined }
   * @param options.gpuMode { String | undefined }
   * @param options.headless { Boolean }
   * @param options.readonly { Boolean }
   */
  async launch(avdName, adbName, isRunning, options = { port: undefined }) {
    if (!isRunning) {
      const launchCommand = new LaunchCommand(avdName, options);
      await retry({
        retries: 2,
        interval: 100,
        conditionFn: isUnknownEmulatorError,
      }, () => this._launchEmulator(avdName, launchCommand, adbName));
    }
    await this._awaitEmulatorBoot(adbName);
    await this._notifyBootEvent(adbName, avdName, !isRunning);
  }

  async shutdown(adbName) {
    await this._notifyPreShutdown(adbName);
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
    await this._notifyShutdownCompleted(adbName);
  }

  _launchEmulator(emulatorName, launchCommand, adbName) {
    return launchEmulatorProcess(emulatorName, this._emulatorExec, launchCommand, this._adb, adbName);
  }

  async _awaitEmulatorBoot(adbName) {
    await retry({ retries: 240, interval: 2500, shouldUnref: true }, async () => {
      const isBootComplete = await this._adb.isBootComplete(adbName);

      if (!isBootComplete) {
        throw new DetoxRuntimeError({
          message: `Waited for ${adbName} to complete booting for too long!`,
        });
      }
    });
  }
}

module.exports = EmulatorLauncher;
