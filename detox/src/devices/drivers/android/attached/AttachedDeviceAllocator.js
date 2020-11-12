const AndroidDeviceAllocator = require('../AndroidDeviceAllocator');

// TODO unit test
class AttachedDeviceAllocator extends AndroidDeviceAllocator {
  constructor(deviceRegistry, freeDeviceFinder) {
    super(deviceRegistry);
    this.freeDeviceFinder = freeDeviceFinder;
  }

  async _allocateDeviceSynchronized(deviceQuery) {
    return await this.freeDeviceFinder.findFreeDevice(deviceQuery);
  }
}

module.exports = AttachedDeviceAllocator;
