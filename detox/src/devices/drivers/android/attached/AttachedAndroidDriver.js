const _ = require('lodash');
const AndroidDriver = require('../AndroidDriver');
const AttachedDeviceAllocator = require('./AttachedDeviceAllocator');

class AttachedAndroidDriver extends AndroidDriver {
  constructor(config) {
    super(config);
    this._name = 'Unnamed Android Device';
    this._deviceAllocator = new AttachedDeviceAllocator(this.deviceRegistry, this.adb);
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
