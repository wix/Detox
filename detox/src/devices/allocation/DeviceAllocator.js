// @ts-nocheck
const log = require('../../utils/logger').child({ cat: 'device' });
const traceMethods = require('../../utils/traceMethods');

class DeviceAllocator {
  /**
   * @param allocationDriver { AllocationDriverBase }
   */
  constructor(allocationDriver) {
    this._driver = allocationDriver;
    traceMethods(log, this, ['init', 'allocate', 'postAllocate', 'free', 'cleanup', 'emergencyCleanup']);
  }

  /**
   * @returns {Promise<void>}
   */
  init() {
    return typeof this._driver.init === 'function'
      ? this._driver.init()
      : Promise.resolve();
  }

  /**
   * @param deviceConfig { Object }
   * @returns {Promise<DeviceCookie>}
   */
  allocate(deviceConfig) {
    return this._driver.allocate(deviceConfig);
  }

  /**
   * @param {DeviceCookie} deviceCookie
   * @returns {Promise<unknown>}
   */
  postAllocate(deviceCookie) {
    return typeof this._driver.postAllocate === 'function'
      ? this._driver.postAllocate(deviceCookie)
      : Promise.resolve();
  }

  /**
   * @param cookie { DeviceCookie }
   * @param options { DeallocOptions }
   * @returns {Promise<void>}
   */
  free(cookie, options) {
    return this._driver.free(cookie, options);
  }

  /**
   * @returns {Promise<void>}
   */
  cleanup() {
    return typeof this._driver.cleanup === 'function'
      ? this._driver.cleanup()
      : Promise.resolve();
  }

  /**
   * @returns {void}
   */
  emergencyCleanup() {
    return typeof this._driver.emergencyCleanup === 'function'
      ? this._driver.emergencyCleanup()
      : undefined;
  }
}

module.exports = DeviceAllocator;
