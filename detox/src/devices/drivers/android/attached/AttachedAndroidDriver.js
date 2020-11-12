const _ = require('lodash');
const AndroidDriver = require('../AndroidDriver');
const AttachedDeviceAllocator = require('./AttachedDeviceAllocator');
const FreeDeviceFinder = require('../tools/FreeDeviceFinder');

class AttachedAndroidDriver extends AndroidDriver {
  constructor(config) {
    super(config);
    this._name = 'Unnamed Android Device';

    const freeDeviceFinder = new FreeDeviceFinder(this.adb, this.deviceRegistry);
    this._deviceAllocator = new AttachedDeviceAllocator(this.deviceRegistry, freeDeviceFinder);
  }

  get name() {
    return this._name;
  }

  async acquireFreeDevice(deviceQuery) {
    const adbNamePattern = _.isPlainObject(deviceQuery) ? deviceQuery.adbName : deviceQuery;

    const adbName = await this._deviceAllocator.allocateDevice(adbNamePattern);

    await this.adb.apiLevel(adbName);
    await this.adb.unlockScreen(adbName);
    await this.emitter.emit('bootDevice', { coldBoot: false, deviceId: adbName, type: 'device' });

    this._name = adbName;
    return adbName;
  }
}

module.exports = AttachedAndroidDriver;
