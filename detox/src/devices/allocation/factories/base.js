const { DeviceAllocator, DeviceDeallocator } = require('../DeviceAllocator');

class DeviceAllocatorFactory {
  /**
   * @param deps { Object }
   * @returns { { allocator: DeviceAllocator, createDeallocator: (deviceCookie: DeviceCookie) => DeviceDeallocator} }
   */
  createDeviceAllocator(deps) {
    const {
      allocDriver,
      createDeallocDriver,
    } = this._createDriver(deps);

    return {
      allocator: new DeviceAllocator(allocDriver),
      createDeallocator: (deviceCookie) => new DeviceDeallocator(createDeallocDriver(deviceCookie)),
    };
  }

  _createDriver(deps) {} // eslint-disable-line no-unused-vars
}

module.exports = DeviceAllocatorFactory;
