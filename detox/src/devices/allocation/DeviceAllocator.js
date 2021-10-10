const { traceCall } = require('../../utils/trace');

class DeviceAllocator {
  /**
   * @param allocationDriver { AllocationDriverBase }
   */
  constructor(allocationDriver) {
    this._driver = allocationDriver;
  }

  /**
   * @param deviceConfig { Object }
   * @return {Promise<DeviceCookie>}
   */
  allocate(deviceConfig) {
    return traceCall('allocateDevice', () =>
      this._driver.allocate(deviceConfig));
  }
}

class DeviceDeallocator {
  /**
   * @param deallocationDriver { DeallocationDriverBase }
   */
  constructor(deallocationDriver) {
    this._driver = deallocationDriver;
  }
  /**
   * @param options { {shutdown: boolean} }
   * @return {Promise<void>}
   */
  free(options) {
    return this._driver.free(options);
  }
}

module.exports = {
  DeviceAllocator,
  DeviceDeallocator,
};
