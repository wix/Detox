const _ = require('lodash');
const AndroidDriver = require('../AndroidDriver');
const FreeDeviceFinder = require('../tools/FreeDeviceFinder');

class AttachedAndroidDriver extends AndroidDriver {
  constructor(config) {
    super(config);
    this._name = 'Unnamed Android Device';

    this._freeDeviceFinder = new FreeDeviceFinder(this.adb, this.deviceRegistry);
  }

  get name() {
    return this._name;
  }

  async acquireFreeDevice(deviceQuery) {
    const adbNamePattern = _.isPlainObject(deviceQuery) ? deviceQuery.adbName : deviceQuery;
    const adbName = await this.deviceRegistry.allocateDevice(() => this._freeDeviceFinder.findFreeDevice(adbNamePattern));

    await this.adb.apiLevel(adbName);
    await this.adb.unlockScreen(adbName);
    await this.emitter.emit('bootDevice', { coldBoot: false, deviceId: adbName, type: 'device' });

    this._name = adbName;
    return adbName;
  }
}

module.exports = AttachedAndroidDriver;
