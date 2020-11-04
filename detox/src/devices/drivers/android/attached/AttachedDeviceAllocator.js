const AndroidDeviceAllocator = require('../AndroidDeviceAllocator');
const FreeDeviceFinder = require('../tools/FreeDeviceFinder');

class AttachedDeviceAllocator extends AndroidDeviceAllocator {
  constructor(deviceRegistry, adb) {
    super(deviceRegistry);
    this.freeDeviceFinder = new FreeDeviceFinder(adb, this.deviceRegistry); // TODO push this back to the driver
  }

  async _allocateDeviceSynchronized(deviceQuery) {
    return await this.freeDeviceFinder.findFreeDevice(deviceQuery);
  }
}

module.exports = AttachedDeviceAllocator;
