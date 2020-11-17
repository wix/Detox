const _ = require('lodash');
const AndroidDriver = require('../AndroidDriver');
const FreeDeviceFinder = require('../tools/FreeDeviceFinder');
const DeviceRegistry = require('../../../DeviceRegistry');

class AttachedAndroidDriver extends AndroidDriver {
  constructor(config) {
    super(config);
    this._name = 'Unnamed Android Device';

    this._freeDeviceFinder = new FreeDeviceFinder(this.adb, this.deviceRegistry);
    this._deviceRegistry = DeviceRegistry.forAndroid();
  }

  get name() {
    return this._name;
  }

  async acquireFreeDevice(deviceQuery) {
    const adbNamePattern = _.isPlainObject(deviceQuery) ? deviceQuery.adbName : deviceQuery;
    const adbName = await this._deviceRegistry.allocateDevice(() => this._freeDeviceFinder.findFreeDevice(adbNamePattern));

    await this.adb.apiLevel(adbName);
    await this.adb.unlockScreen(adbName);
    await this.emitter.emit('bootDevice', { coldBoot: false, deviceId: adbName, type: 'device' });

    this._name = adbName;
    return adbName;
  }

  async cleanup(deviceId, bundleId) {
    await this._deviceRegistry.disposeDevice(deviceId);
    await super.cleanup(deviceId, bundleId);
  }
}

module.exports = AttachedAndroidDriver;
