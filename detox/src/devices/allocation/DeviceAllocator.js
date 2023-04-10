// @ts-nocheck
const log = require('../../utils/logger').child({ cat: 'device' });
const traceMethods = require('../../utils/traceMethods');

class DeviceAllocator {
  /**
   * @param allocationDriver { AllocationDriverBase }
   */
  constructor(allocationDriver) {
    this._driver = allocationDriver;
    traceMethods(log, this, ['allocate', 'postAllocate', 'free']);
  }

  /**
   * @param deviceConfig { Object }
   * @return {Promise<DeviceCookie>}
   */
  allocate(deviceConfig) {
    return this._driver.allocate(deviceConfig);
  }

  /**
   * @param {DeviceCookie} deviceCookie
   * @return {Promise<unknown>}
   */
  postAllocate(deviceCookie) {
    if (typeof this._driver.postAllocate !== 'function') {
      return Promise.resolve();
    }

    return this._driver.postAllocate(deviceCookie);
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
