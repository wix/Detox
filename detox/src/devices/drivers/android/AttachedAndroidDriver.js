const _ = require('lodash');
const AndroidDriver = require('./AndroidDriver');
const FreeAdbDeviceFinder = require('./FreeAdbDeviceFinder');
const DeviceRegistry = require('../../DeviceRegistry');
const environment = require('../../../utils/environment');
const log = require('../../../utils/logger').child({ __filename });

const ALLOCATE_DEVICE_LOG_EVT = 'ALLOCATE_DEVICE';

class AttachedAndroidDriver extends AndroidDriver {
  constructor(config) {
    super(config);

    this.deviceRegistry = new DeviceRegistry({
      lockfilePath: environment.getDeviceLockFilePathAndroid()
    });

    this._name = 'Unnamed Android Device';
  }

  get name() {
    return this._name;
  }

  async acquireFreeDevice(deviceQuery) {
    const adbNamePattern = _.isPlainObject(deviceQuery) ? deviceQuery.adbName : deviceQuery;

    const adbName = await this._allocateDevice(adbNamePattern);

    await this.adb.apiLevel(adbName);
    await this.adb.unlockScreen(adbName);

    this._name = adbName;
    return adbName;
  }

  async cleanup(adbName, bundleId) {
    await this.deviceRegistry.disposeDevice(adbName);
    await super.cleanup(adbName, bundleId);
  }

  async _allocateDevice(adbNamePattern) {
    log.debug({ event: ALLOCATE_DEVICE_LOG_EVT }, `Trying to allocate a device based on "${adbNamePattern}"`);
    const adbName = await this.deviceRegistry.allocateDevice(() => this._doAllocateDevice(adbNamePattern));
    log.debug({ event: ALLOCATE_DEVICE_LOG_EVT }, `Settled on ${adbName}`);
    return adbName;
  }

  async _doAllocateDevice(adbNamePattern) {
    const freeDeviceFinder = new FreeAdbDeviceFinder(this.adb, this.deviceRegistry, adbNamePattern);
    const freeDeviceAdbName = await freeDeviceFinder.findFreeDevice();
    return freeDeviceAdbName;
  }
}

module.exports = AttachedAndroidDriver;
