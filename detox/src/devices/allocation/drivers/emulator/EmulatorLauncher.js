const _ = require('lodash');

const { DetoxRuntimeError } = require('../../../../errors');
const retry = require('../../../../utils/retry');
const DeviceLauncher = require('../DeviceLauncher');
const { LaunchCommand } = require('../../../runtime/drivers/android/exec/EmulatorExec');
const { traceCall } = require('../../../../utils/trace');
const { launchEmulatorProcess } = require('./launchEmulatorProcess');

const isUnknownEmulatorError = (err) => (err.message || '').includes('failed with code null');

class EmulatorLauncher extends DeviceLauncher {
  constructor({ adb, emulatorExec, eventEmitter }) {
    super(eventEmitter);
    this._adb = adb;
    this._emulatorExec = emulatorExec;
  }

  async launch(avdName, adbName, options = { port: undefined }) {
    const launchCommand = new LaunchCommand(avdName, options);

    await retry({
      retries: 2,
      interval: 100,
      conditionFn: isUnknownEmulatorError,
    }, () => this._launchEmulator(avdName, launchCommand));
    await this._awaitEmulatorBoot(adbName);
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

  _launchEmulator(emulatorName, launchCommand) {
    return launchEmulatorProcess(emulatorName, this._emulatorExec, launchCommand);
  }

  async _awaitEmulatorBoot(adbName) {
    await traceCall('awaitBoot', () =>
      this._waitForBootToComplete(adbName));
  }

  async _waitForBootToComplete(adbName) {
    await retry({ retries: 240, interval: 2500 }, async () => {
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
