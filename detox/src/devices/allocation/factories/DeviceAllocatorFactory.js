const { DeviceAllocator, DeviceDeallocator } = require('../DeviceAllocator');

class DeviceAllocatorFactory {
  /**
   * @param eventEmitter { AsyncEmitter }
   * @returns { { allocator: DeviceAllocator, createDeallocator: (deviceCookie: DeviceCookie) => DeviceDeallocator} }
   */
  createDeviceAllocator(eventEmitter) {
    const {
      allocDriver,
      createDeallocDriver,
    } = this._createAllocationDriver(eventEmitter);

    return {
      allocator: new DeviceAllocator(allocDriver),
      createDeallocator: (deviceCookie) => new DeviceDeallocator(createDeallocDriver(deviceCookie)),
    };
  }

  /**
   * @private
   */
  _createAllocationDriver(eventEmitter) {}
}

module.exports = DeviceAllocatorFactory;
