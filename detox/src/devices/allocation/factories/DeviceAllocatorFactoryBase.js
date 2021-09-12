const { DeviceAllocator, DeviceDeallocator } = require('../DeviceAllocator');

class DeviceAllocatorFactoryBase {
  constructor(driverFactory) {
    this._driverFactory = driverFactory;
  }

  /**
   * @param eventEmitter { AsyncEmitter }
   * @returns { { allocator: DeviceAllocator, createDeallocator: (deviceCookie: DeviceCookie) => DeviceDeallocator} }
   */
  createDeviceAllocator(eventEmitter) {
    const {
      allocDriver,
      createDeallocDriver,
    } = this._driverFactory.createAllocationDriver({ eventEmitter });

    return {
      allocator: new DeviceAllocator(allocDriver),
      createDeallocator: (deviceCookie) => new DeviceDeallocator(createDeallocDriver(deviceCookie)),
    };
  }
}

module.exports = DeviceAllocatorFactoryBase;
