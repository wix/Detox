const _ = require('lodash');

const Deferred = require('../../../../../utils/Deferred');
const detectConcurrentDetox = require('../../../../../utils/detectConcurrentDetox');
const log = require('../../../../../utils/logger').child({ __filename });
const AndroidEmulatorCookie = require('../../../../cookies/AndroidEmulatorCookie');
const AllocationDriverBase = require('../../AllocationDriverBase');

const { patchAvdSkinConfig } = require('./patchAvdSkinConfig');

class EmulatorAllocDriver extends AllocationDriverBase {
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
    super();

    /** @type {Deferred} */
    this._deferredAllocation = Deferred.resolved(null);
    /** @type {Promise<string> | null} */
    this._pendingAllocation = null;

    this._adb = adb;
    this._avdValidator = avdValidator;
    this._deviceRegistry = deviceRegistry;
    debugger;
    this._emulatorVersionResolver = emulatorVersionResolver;
    this._emulatorLauncher = emulatorLauncher;
    this._freeDeviceFinder = freeDeviceFinder;
    this._freePortFinder = freePortFinder;
    this._shouldShutdown = detoxConfig.behavior.cleanup.shutdownDevice;
  }

  async init() {
    if (!detectConcurrentDetox()) {
      await this._deviceRegistry.reset();
    }
  }

  /**
   * @param deviceConfig
   * @returns {Promise<AndroidEmulatorCookie>}
   */
  async allocate(deviceConfig) {
    await this._pendingAllocation.catch(() => { /* ignore previous errors */ });
    this._deferredAllocation = new Deferred();
    this._pendingAllocation = this._deviceRegistry.registerDevice(() => this._deferredAllocation.promise);

    try {
      return await this._doAllocate(deviceConfig);
    } catch (e) {
      this._deferredAllocation.reject(e);
      throw e;
    }
  }

  /**
   * @param deviceConfig
   * @returns {Promise<AndroidEmulatorCookie>}
   */
  async _doAllocate(deviceConfig) {
    const avdName = deviceConfig.device.avdName;

    await this._avdValidator.validate(avdName, deviceConfig.headless);
    await this._fixAvdConfigIniSkinNameIfNeeded(avdName, deviceConfig.headless);

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

    return new AndroidEmulatorCookie(adbName);
  }

  /**
    * @param {AndroidEmulatorCookie} deviceCookie
    */
  async postAllocate(deviceCookie) {
    try {
      await this._doPostAllocate(deviceCookie);
      this._deferredAllocation.resolve(deviceCookie.adbName);
    } catch (e) {
      this._deferredAllocation.reject(e);
      throw e;
    }
  }

  /**
   * @param {AndroidEmulatorCookie} deviceCookie
   * @returns {Promise<void>}
   */
  async _doPostAllocate(deviceCookie) {
    const { adbName } = deviceCookie;

    await this._emulatorLauncher.awaitEmulatorBoot(adbName);
    await this._adb.apiLevel(adbName);
    await this._adb.disableAndroidAnimations(adbName);
    await this._adb.unlockScreen(adbName);
  }

  /**
   * @param cookie {AndroidEmulatorCookie}
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
      log.warn({ event: 'DEVICE_ALLOCATOR', err }, `Failed to shutdown emulator ${adbName}`);
    }
  }

  async _fixAvdConfigIniSkinNameIfNeeded(avdName, isHeadless) {
    const rawBinaryVersion = await this._emulatorVersionResolver.resolve(isHeadless);
    const binaryVersion = _.get(rawBinaryVersion, 'major');
    return await patchAvdSkinConfig(avdName, binaryVersion);
  }
}

module.exports = EmulatorAllocDriver;
