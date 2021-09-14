const _ = require('lodash');

const AndroidDeviceCookie = require('../../../../cookies/AndroidDeviceCookie');
const { AllocationDriverBase, DeallocationDriverBase } = require('../../AllocationDriverBase');

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
   * @param deviceQuery { Object | String }
   * @return {Promise<AndroidDeviceCookie>}
   */
  async allocate(deviceQuery) {
    const adbNamePattern = _.isPlainObject(deviceQuery) ? deviceQuery.adbName : deviceQuery;
    const adbName = await this._deviceRegistry.allocateDevice(() => this._freeDeviceFinder.findFreeDevice(adbNamePattern));

    // TODO Also disable native animations?
    await this._adb.apiLevel(adbName);
    await this._adb.unlockScreen(adbName);
    await this._attachedAndroidLauncher.notifyLaunchCompleted(adbName);
    return new AndroidDeviceCookie(adbName);
  }
}

class AttachedAndroidDeallocDriver extends DeallocationDriverBase {
  /**
   * @param adbName { String }
   * @param deviceRegistry { DeviceRegistry }
   */
  constructor(adbName, { deviceRegistry }) {
    super();
    this._adbName = adbName;
    this._deviceRegistry = deviceRegistry;
  }

  /**
   * @return {Promise<void>}
   */
  async free() {
    await this._deviceRegistry.disposeDevice(this._adbName);
  }
}

module.exports = {
  AttachedAndroidAllocDriver,
  AttachedAndroidDeallocDriver,
};
