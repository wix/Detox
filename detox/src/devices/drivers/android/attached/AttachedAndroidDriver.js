const DeviceRegistry = require('../../../DeviceRegistry');
const AndroidDriver = require('../AndroidDriver');
const FreeDeviceFinder = require('../tools/FreeDeviceFinder');

class AttachedAndroidDriver extends AndroidDriver {
  constructor(config) {
    super(config);
    this._name = 'Unnamed Android Device';

    this._deviceRegistry = DeviceRegistry.forAndroid();
    this._freeDeviceFinder = new FreeDeviceFinder(this.adb, this._deviceRegistry);
  }

  get name() {
    return this._name;
  }

  async acquireFreeDevice(_deviceQuery, deviceConfig) {
    const adbNamePattern = deviceConfig.device.adbName;
    const adbName = await this._deviceRegistry.allocateDevice(() => {
      return this._freeDeviceFinder.findFreeDevice(adbNamePattern);
    });

    await this.adb.apiLevel(adbName);
    await this.adb.unlockScreen(adbName);
    await this.emitter.emit('bootDevice', { coldBoot: false, deviceId: adbName, type: 'device' });

    this._name = adbName;
    return adbName;
  }

  async cleanup(adbName, bundleId) {
    await this._deviceRegistry.disposeDevice(adbName);
    await super.cleanup(adbName, bundleId);
  }
}

module.exports = AttachedAndroidDriver;
