/**
 * @typedef {import('../../AllocationDriverBase').AllocationDriverBase} AllocationDriverBase
 * @typedef {import('../../../../common/drivers/android/cookies').AndroidDeviceCookie} AndroidDeviceCookie
 */

const _ = require('lodash');

const log = require('../../../../../utils/logger').child({ cat: 'device,device-allocation' });

const { patchAvdSkinConfig } = require('./patchAvdSkinConfig');

/**
 * @implements {AllocationDriverBase}
 */
class EmulatorAllocDriver {
  /**
   * @param {object} options
   * @param {import('../../../../common/drivers/android/exec/ADB')} options.adb
   * @param {import('./AVDValidator')} options.avdValidator
   * @param {DetoxInternals.RuntimeConfig} options.detoxConfig
   * @param {import('../../../DeviceRegistry')} options.deviceRegistry
   * @param {import('./FreeEmulatorFinder')} options.freeDeviceFinder
   * @param {import('./FreePortFinder')} options.freePortFinder
   * @param {import('./EmulatorLauncher')} options.emulatorLauncher
   * @param {import('./EmulatorVersionResolver')} options.emulatorVersionResolver
   */
  constructor({
    adb,
    avdValidator,
    detoxConfig,
    deviceRegistry,
    freeDeviceFinder,
    freePortFinder,
    emulatorVersionResolver,
    emulatorLauncher
  }) {
    this._adb = adb;
    this._avdValidator = avdValidator;
    this._deviceRegistry = deviceRegistry;
    this._emulatorVersionResolver = emulatorVersionResolver;
    this._emulatorLauncher = emulatorLauncher;
    this._freeDeviceFinder = freeDeviceFinder;
    this._freePortFinder = freePortFinder;
    this._shouldShutdown = detoxConfig.behavior.cleanup.shutdownDevice;
    this._fixAvdConfigIniSkinNameIfNeeded = _.memoize(this._fixAvdConfigIniSkinNameIfNeeded.bind(this));
  }

  async init() {
    await this._deviceRegistry.unregisterZombieDevices();
  }

  /**
   * @param deviceConfig
   * @returns {Promise<AndroidDeviceCookie>}
   */
  async allocate(deviceConfig) {
    const avdName = deviceConfig.device.avdName;

    await this._avdValidator.validate(avdName, deviceConfig.headless);
    await this._fixAvdConfigIniSkinNameIfNeeded(avdName, deviceConfig.headless);

    const adbName = await this._deviceRegistry.registerDevice(async () => {
      let adbName = await this._freeDeviceFinder.findFreeDevice(avdName);
      if (!adbName) {
        const port = await this._freePortFinder.findFreePort();
        adbName = `emulator-${port}`;

        await this._emulatorLauncher.launch({
          bootArgs: deviceConfig.bootArgs,
          gpuMode: deviceConfig.gpuMode,
          headless: deviceConfig.headless,
          readonly: deviceConfig.readonly,
          avdName,
          adbName,
          port,
        });
      }

      return adbName;
    });

    return {
      id: adbName,
      adbName,
      name: `${adbName} (${avdName})`,
    };
  }

  /**
   * @param {AndroidDeviceCookie} deviceCookie
   */
  async postAllocate(deviceCookie) {
    const { adbName } = deviceCookie;

    await this._emulatorLauncher.awaitEmulatorBoot(adbName);
    await this._adb.apiLevel(adbName);
    await this._adb.disableAndroidAnimations(adbName);
    await this._adb.unlockScreen(adbName);
  }

  /**
   * @param cookie {AndroidDeviceCookie}
   * @param options {Partial<import('../../AllocationDriverBase').DeallocOptions>}
   * @return {Promise<void>}
   */
  async free(cookie, options = {}) {
    const { adbName } = cookie;

    if (options.shutdown) {
      await this._doShutdown(adbName);
      await this._deviceRegistry.unregisterDevice(adbName);
    } else {
      await this._deviceRegistry.releaseDevice(adbName);
    }
  }

  async cleanup() {
    if (this._shouldShutdown) {
      const { devices } = await this._adb.devices();
      const actualEmulators = devices.map((device) => device.adbName);
      const sessionDevices = await this._deviceRegistry.readSessionDevices();
      const emulatorsToShutdown = _.intersection(sessionDevices.getIds(), actualEmulators);
      const shutdownPromises = emulatorsToShutdown.map((adbName) => this._doShutdown(adbName));
      await Promise.all(shutdownPromises);
    }

    await this._deviceRegistry.unregisterSessionDevices();
  }

  /**
   * @param {string} adbName
   * @return {Promise<void>}
   */
  async _doShutdown(adbName) {
    try {
      await this._emulatorLauncher.shutdown(adbName);
    } catch (err) {
      log.warn({ err }, `Failed to shutdown emulator ${adbName}`);
    }
  }

  async _fixAvdConfigIniSkinNameIfNeeded(avdName, isHeadless) {
    const rawBinaryVersion = await this._emulatorVersionResolver.resolve(isHeadless);
    const binaryVersion = _.get(rawBinaryVersion, 'major');
    return await patchAvdSkinConfig(avdName, binaryVersion);
  }
}

module.exports = EmulatorAllocDriver;
