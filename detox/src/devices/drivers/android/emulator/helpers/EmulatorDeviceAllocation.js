const DetoxRuntimeError = require('../../../../../errors/DetoxRuntimeError');
const logger = require('../../../../../utils/logger').child({ __filename });
const retry = require('../../../../../utils/retry');
const { traceCall } = require('../../../../../utils/trace');
const AndroidDeviceAllocation  = require('../../AndroidDeviceAllocation');

const DetoxEmulatorsPortRange = {
  min: 10000,
  max: 20000
};

class EmulatorDeviceAllocation extends AndroidDeviceAllocation {

  constructor(deviceRegistry, freeDeviceFinder, emulatorLauncher, adb, eventEmitter, rand = Math.random) {
    super(deviceRegistry, eventEmitter, logger);
    this._freeDeviceFinder = freeDeviceFinder;
    this._emulatorLauncher = emulatorLauncher;
    this._adb = adb;
    this._rand = rand;
  }

  /**
   * @param {Detox.DetoxAndroidEmulatorDriverConfig} deviceConfig
   * @returns {Promise<null>}
   */
  async allocateDevice(deviceConfig) {
    const { avdName } = deviceConfig.device;

    this._logAllocationAttempt(avdName);
    const {
      adbName,
      placeholderPort,
    } = await this._doSynchronizedAllocation(avdName);
    this._logAllocationResult(avdName, adbName);

    const coldBoot = !!placeholderPort;
    if (coldBoot) {
      try {
        await this._launchEmulator(avdName, {
          bootArgs: deviceConfig.bootArgs,
          gpuMode: deviceConfig.gpuMode,
          headless: deviceConfig.headless,
          readonly: deviceConfig.readonly,
          port: placeholderPort,
        });
      } catch (e) {
        await this.deallocateDevice(adbName);
        throw e;
      }
    }
    await this._awaitEmulatorBoot(adbName);
    await this._notifyAllocation(adbName, avdName, coldBoot);
    return adbName;
  }

  async deallocateDevice(adbName) {
    await this._deviceRegistry.disposeDevice(adbName);
  }

  async _doSynchronizedAllocation(avdName) {
    let placeholderPort = null;
    let adbName = null;

    await this._deviceRegistry.allocateDevice(async () => {
      adbName = await this._freeDeviceFinder.findFreeDevice(avdName);
      if (!adbName) {
        placeholderPort = this._allocateEmulatorPlaceholderPort();
        adbName = `emulator-${placeholderPort}`;
      }
      return adbName;
    });

    return {
      adbName,
      placeholderPort,
    };
  }

  async _launchEmulator(avdName, options) {
    await traceCall('emulatorLaunch', () =>
      this._emulatorLauncher.launch(avdName, options));
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

  _allocateEmulatorPlaceholderPort() {
    const { min, max } = DetoxEmulatorsPortRange;
    let port = this._rand() * (max - min) + min;
    port = port & 0xFFFFFFFE; // Should always be even
    return port;
  }
}

module.exports = EmulatorDeviceAllocation;
