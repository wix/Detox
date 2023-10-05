// @ts-nocheck
const DeviceAllocator = require('../DeviceAllocator');

class DeviceAllocatorFactory {
  /**
   * @param deps { Object }
   * @returns { DeviceAllocator }
   */
  createDeviceAllocator(deps) {
    const allocDriver = this._createDriver(deps);
    return new DeviceAllocator(allocDriver);
  }

  /**
   * @param deps
   * @returns { AllocationDriverBase }
   * @private
   */
  _createDriver(deps) {} // eslint-disable-line @typescript-eslint/no-unused-vars
}

module.exports = DeviceAllocatorFactory;
