/**
 * @typedef {import('../../../../common/drivers/android/cookies').AndroidDeviceCookie} AndroidDeviceCookie
 * @typedef {import('../../../../common/drivers/android/cookies').EmulatorDeviceCookie} EmulatorDeviceCookie
 * @typedef {import('../../../../common/drivers/android/tools/DeviceHandle')} DeviceHandle
 */

const _ = require('lodash');

const log = require('../../../../../utils/logger').child({ cat: 'device,device-allocation' });
const { isPortTaken } = require('../../../../../utils/netUtils');
const adbPortRegistry = require('../../../../common/drivers/android/AdbPortRegistry');
const AndroidAllocDriver = require('../AndroidAllocDriver');

const { patchAvdSkinConfig } = require('./patchAvdSkinConfig');

class EmulatorAllocDriver extends AndroidAllocDriver {
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
    super({ adb });
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
   * @returns {Promise<EmulatorDeviceCookie>}
   */
  async allocate(deviceConfig) {
    const avdName = deviceConfig.device.avdName;
    const useSeparateAdbServers = deviceConfig.useSeparateAdbServers === true;

    await this._avdValidator.validate(avdName, deviceConfig.headless);
    await this._fixAvdConfigIniSkinNameIfNeeded(avdName, deviceConfig.headless);

    let adbServerPort;
    let adbName;

    await this._deviceRegistry.registerDevice(async () => {
      const candidates = await this._getAllDevices(useSeparateAdbServers);
      const device = await this._freeDeviceFinder.findFreeDevice(candidates, avdName);

      if (device) {
        adbName = device.adbName;
        adbServerPort = device.adbServerPort;
        adbPortRegistry.register(adbName, adbServerPort);
      } else {
        const port = await this._freePortFinder.findFreePort();

        adbName = `emulator-${port}`;
        adbServerPort = this._getFreeAdbServerPort(candidates);
        adbPortRegistry.register(adbName, adbServerPort);

        try {
          await this._emulatorLauncher.launch({
            bootArgs: deviceConfig.bootArgs,
            gpuMode: deviceConfig.gpuMode,
            headless: deviceConfig.headless,
            readonly: deviceConfig.readonly,
            avdName,
            adbName,
            port,
            adbServerPort,
          });
        } catch (e) {
          adbPortRegistry.unregister(adbName);
        }
      }

      return adbName;
    });

    return {
      id: adbName,
      adbName,
      name: `${adbName} (${avdName})`,
      adbServerPort,
    };
  }

  /**
   * @param {AndroidDeviceCookie} deviceCookie
   * @param {{ deviceConfig: Detox.DetoxSharedAndroidDriverConfig }} configs
   * @returns {Promise<AndroidDeviceCookie>}
   */
  async postAllocate(deviceCookie, configs) {
    const { adbName } = deviceCookie;

    await this._emulatorLauncher.awaitEmulatorBoot(adbName);
    await this._adb.apiLevel(adbName);
    await this._adb.disableAndroidAnimations(adbName);
    await this._adb.unlockScreen(adbName);
    await super.postAllocate(deviceCookie, configs);

    return deviceCookie;
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

      adbPortRegistry.unregister(adbName);
    } else {
      await this._deviceRegistry.releaseDevice(adbName);
    }
  }

  async cleanup() {
    if (this._shouldShutdown) {
      const devices = await this._getAllDevices(true);
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

  /**
   * @param {boolean} useSeparateAdbServers
   * @returns {Promise<DeviceHandle[]>}
   * @private
   */
  async _getAllDevices(useSeparateAdbServers) {
    const adbServers = await this._getRunningAdbServers(useSeparateAdbServers);
    return (await this._adb.devices({}, adbServers)).devices;
  }

  /**
   * @param {boolean} useSeparateAdbServers
   * @returns {Promise<number[]>}
   * @private
   */
  async _getRunningAdbServers(useSeparateAdbServers = true) {
    const ports = [this._adb.defaultServerPort];

    if (useSeparateAdbServers) {
        for (let port = this._adb.defaultServerPort + 1; await isPortTaken(port); port++) {
          ports.push(port);
        }
    }    
    return ports;
  }

  _getFreeAdbServerPort(currentDevices) {
    const maxPortDevice = _.maxBy(currentDevices, 'adbServerPort');
    return _.get(maxPortDevice, 'adbServerPort', this._adb.defaultServerPort) + 1;
  }
}

module.exports = EmulatorAllocDriver;
