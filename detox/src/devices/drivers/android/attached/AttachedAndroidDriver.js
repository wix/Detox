const _ = require('lodash');
const AndroidDriver = require('../AndroidDriver');
const FreeAdbDeviceFinder = require('./FreeAdbDeviceFinder');

class AttachedAndroidDriver extends AndroidDriver {
  constructor(config) {
    super(config);
    
    this.freeDeviceFinder = new FreeAdbDeviceFinder(this.adb, this.deviceRegistry);
    this._name = 'Unnamed Android Device';
  }

  get name() {
    return this._name;
  }

  async acquireFreeDevice(deviceQuery) {
    const adbNamePattern = _.isPlainObject(deviceQuery) ? deviceQuery.adbName : deviceQuery;

    const adbName = await this.allocateDevice(adbNamePattern);

    await this.adb.apiLevel(adbName);
    await this.adb.unlockScreen(adbName);
    await this.emitter.emit('bootDevice', { coldBoot: false, deviceId: adbName, type: 'device' });

    this._name = adbName;
    return adbName;
  }

  async doAllocateDevice(deviceQuery) {
    return await this.freeDeviceFinder.findFreeDevice(deviceQuery);
  }
}

module.exports = AttachedAndroidDriver;
