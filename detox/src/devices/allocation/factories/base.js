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
    } = this._createDriver({ eventEmitter });

    return {
      allocator: new DeviceAllocator(allocDriver),
      createDeallocator: (deviceCookie) => new DeviceDeallocator(createDeallocDriver(deviceCookie)),
    };
  }

  _createDriver(deps) {} // eslint-disable-line no-unused-vars
}

module.exports = DeviceAllocatorFactory;
