/**
 * @typedef {import('../../AllocationDriverBase').AllocationDriverBase} AllocationDriverBase
 * @typedef {import('../../../../common/drivers/android/cookies').AndroidDeviceCookie} AndroidDeviceCookie
 */

/**
 * @implements {AllocationDriverBase}
 */
class AttachedAndroidAllocDriver {
  /**
   * @param {object} options
   * @param {import('../../../../common/drivers/android/exec/ADB')} options.adb
   * @param {import('../../../DeviceRegistry')} options.deviceRegistry
   * @param {import('../FreeDeviceFinder')} options.freeDeviceFinder
   */
  constructor({ adb, deviceRegistry, freeDeviceFinder }) {
    this._adb = adb;
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
    const adbName = await this._deviceRegistry.registerDevice(() => this._freeDeviceFinder.findFreeDevice(adbNamePattern));

    return { id: adbName, adbName };
  }

  /**
   * @param {AndroidDeviceCookie} deviceCookie
   * @returns {Promise<void>}
   */
  async postAllocate(deviceCookie) {
    const { adbName } = deviceCookie;

    await this._adb.apiLevel(adbName);
    await this._adb.unlockScreen(adbName);
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
