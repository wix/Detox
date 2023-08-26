// @ts-nocheck
const log = require('../../utils/logger').child({ cat: 'device', event: 'DEVICE_ALLOCATOR' });
const traceMethods = require('../../utils/traceMethods');

class DeviceAllocator {
  /**
   * @param allocationDriver { AllocationDriverBase }
   */
  constructor(allocationDriver) {
    this._driver = allocationDriver;
    traceMethods(log, this, ['init', 'cleanup', 'emergencyCleanup']);
  }

  /**
   * @returns {Promise<void>}
   */
  async init() {
    if (typeof this._driver.init === 'function') {
      await this._driver.init();
    }
  }

  /**
   * @param deviceConfig { Object }
   * @returns {Promise<DeviceCookie>}
   */
  async allocate(deviceConfig) {
    return await log.trace.complete({ data: deviceConfig, id: Math.random() }, 'allocate', async () => {
      const cookie = await this._driver.allocate(deviceConfig);
      log.debug(`settled on ${cookie}`);
      return cookie;
    });
  }

  /**
   * @param {DeviceCookie} deviceCookie
   * @returns {Promise<DeviceCookie>}
   */
  async postAllocate(deviceCookie) {
    return await log.trace.complete({ data: deviceCookie, id: Math.random() }, `post-allocate: ${deviceCookie}`, async () => {
      const updatedCookie = typeof this._driver.postAllocate === 'function'
        ? await this._driver.postAllocate(deviceCookie)
        : undefined;

      return updatedCookie || deviceCookie;
    });
  }

  /**
   * @param cookie { DeviceCookie }
   * @param options { DeallocOptions }
   * @returns {Promise<void>}
   */
  async free(cookie, options) {
    return await log.trace.complete({ data: options, id: Math.random() }, `free: ${cookie}`, async () => {
      await this._driver.free(cookie, options);
    });
  }

  /**
   * @returns {Promise<void>}
   */
  async cleanup() {
    if (typeof this._driver.cleanup === 'function') {
      await this._driver.cleanup();
    }
  }

  /**
   * @returns {void}
   */
  emergencyCleanup() {
    if (typeof this._driver.emergencyCleanup === 'function') {
      this._driver.emergencyCleanup();
    }
  }
}

module.exports = DeviceAllocator;
