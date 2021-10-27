const AttachedAndroidDeviceCookie = require('../../../../cookies/AttachedAndroidDeviceCookie');
const AllocationDriverBase = require('../../AllocationDriverBase');

class AttachedAndroidAllocDriver extends AllocationDriverBase {
  /**
   * @param adb { ADB }
   * @param deviceRegistry { DeviceRegistry }
   * @param freeDeviceFinder { FreeDeviceFinder }
   * @param attachedAndroidLauncher { AttachedAndroidLauncher }
   */
  constructor({ adb, deviceRegistry, freeDeviceFinder, attachedAndroidLauncher }) {
    super();
    this._adb = adb;
    this._deviceRegistry = deviceRegistry;
    this._freeDeviceFinder = freeDeviceFinder;
    this._attachedAndroidLauncher = attachedAndroidLauncher;
  }

  /**
   * @param deviceConfig
   * @return {Promise<AndroidDeviceCookie>}
   */
  async allocate(deviceConfig) {
    const adbNamePattern = deviceConfig.device.adbName;
    const adbName = await this._deviceRegistry.allocateDevice(() => this._freeDeviceFinder.findFreeDevice(adbNamePattern));

    // TODO Also disable native animations?
    await this._adb.apiLevel(adbName);
    await this._adb.unlockScreen(adbName);
    await this._attachedAndroidLauncher.notifyLaunchCompleted(adbName);
    return new AttachedAndroidDeviceCookie(adbName);
  }

  /**
   * @param cookie { AttachedAndroidDeviceCookie }
   * @return {Promise<void>}
   */
  async free(cookie) {
    const { adbName } = cookie;
    await this._deviceRegistry.disposeDevice(adbName);
  }
}

module.exports = AttachedAndroidAllocDriver;
