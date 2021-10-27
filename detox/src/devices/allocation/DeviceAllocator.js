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

  /**
   * @param cookie { DeviceCookie }
   * @param options { DeallocOptions }
   * @return {Promise<void>}
   */
  free(cookie, options) {
    return this._driver.free(cookie, options);
  }
}

module.exports = DeviceAllocator;
