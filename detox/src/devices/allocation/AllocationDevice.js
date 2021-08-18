const { traceCall } = require('../../utils/trace');

class AllocationDevice {
  constructor(allocationDriver) {
    this._driver = allocationDriver;
  }

  /**
   * @param deviceQuery { Object | String }
   * @return {Promise<DeviceCookie>}
   */
  allocate(deviceQuery) {
    return traceCall('allocateDevice', () =>
      this._driver.allocate(deviceQuery));
  }

  /**
   * @param options { {shutdown: boolean} }
   * @return {Promise<void>}
   */
  free(options) {
    return this._driver.free(options);
  }
}

module.exports = AllocationDevice;
