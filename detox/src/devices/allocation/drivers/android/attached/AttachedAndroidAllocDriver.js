/**
 * @typedef {import('../../../../common/drivers/android/cookies').AndroidDeviceCookie} AndroidDeviceCookie
 */

const DetoxRuntimeError = require('../../../../../errors/DetoxRuntimeError');
const AndroidAllocDriver = require('../AndroidAllocDriver');

class AttachedAndroidAllocDriver extends AndroidAllocDriver {
  /**
   * @param {object} options
   * @param {import('../../../../common/drivers/android/exec/ADB')} options.adb
   * @param {import('../../../DeviceRegistry')} options.deviceRegistry
   * @param {import('../FreeDeviceFinder')} options.freeDeviceFinder
   */
  constructor({ adb, deviceRegistry, freeDeviceFinder }) {
    super({ adb });
    this._deviceRegistry = deviceRegistry;
    this._freeDeviceFinder = freeDeviceFinder;
  }

  async init() {
    await this._deviceRegistry.unregisterZombieDevices();
  }

  /**
   * @param deviceConfig
   * @return {Promise<AndroidDeviceCookie>}
   */
  async allocate(deviceConfig) {
    const adbNamePattern = deviceConfig.device.adbName;
    const adbName = await this._deviceRegistry.registerDevice(async () => {
      const { devices } = await this._adb.devices();
      const device = await this._freeDeviceFinder.findFreeDevice(devices, adbNamePattern);
      if (!device) {
        throw new DetoxRuntimeError(`Failed to find device matching ${adbNamePattern}`);
      }

      return device.adbName;
    });

    return { id: adbName, adbName };
  }

  /**
   * @param {AndroidDeviceCookie} deviceCookie
   * @param {{ deviceConfig: Detox.DetoxSharedAndroidDriverConfig }} configs
   * @returns {Promise<AndroidDeviceCookie>}
   */
  async postAllocate(deviceCookie, configs) {
    const { adbName } = deviceCookie;

    await this._adb.apiLevel(adbName);
    await this._adb.unlockScreen(adbName);
    await super.postAllocate(deviceCookie, configs);

    return deviceCookie;
  }

  /**
   * @param cookie { AndroidDeviceCookie }
   * @return {Promise<void>}
   */
  async free(cookie) {
    const { adbName } = cookie;
    await this._deviceRegistry.unregisterDevice(adbName);
  }
}

module.exports = AttachedAndroidAllocDriver;
