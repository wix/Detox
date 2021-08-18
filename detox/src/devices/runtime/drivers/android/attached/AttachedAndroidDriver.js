const _ = require('lodash');

const DeviceRegistry = require('../../../../DeviceRegistry');
const AndroidDriver = require('../AndroidDriver');
const FreeDeviceFinder = require('../tools/FreeDeviceFinder');

class AttachedAndroidDriver extends AndroidDriver {
  /**
   * @param deviceCookie { AndroidDeviceCookie }
   * @param config { Object }
   */
  constructor(deviceCookie, config) {
    super(deviceCookie, config);
    this._deviceRegistry = DeviceRegistry.forAndroid();
    this._freeDeviceFinder = new FreeDeviceFinder(this.adb, this._deviceRegistry);
  }

  getDeviceName() {
    return `AttachedDevice:${this.cookie.adbName}`;
  }

  async acquireFreeDevice(deviceQuery) {
    const adbNamePattern = _.isPlainObject(deviceQuery) ? deviceQuery.adbName : deviceQuery;
    const adbName = await this._deviceRegistry.allocateDevice(() => this._freeDeviceFinder.findFreeDevice(adbNamePattern));

    await this.adb.apiLevel(adbName);
    await this.adb.unlockScreen(adbName);
    await this.emitter.emit('bootDevice', { coldBoot: false, deviceId: adbName, type: 'device' });

    return adbName;
  }

  async cleanup(adbName, bundleId) {
    await this._deviceRegistry.disposeDevice(adbName);
    await super.cleanup(adbName, bundleId);
  }
}

module.exports = AttachedAndroidDriver;
