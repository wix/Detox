/**
 * @typedef {import('./drivers/AllocationDriverBase').AllocationDriverBase} AllocationDriverBase
 * @typedef {import('./drivers/AllocationDriverBase').DeallocOptions} DeallocOptions
 * @typedef {import('../common/drivers/DeviceCookie').DeviceCookie} DeviceCookie
 */

const _ = require('lodash');

const log = require('../../utils/logger').child({ cat: 'device,device-allocation' });
const traceMethods = require('../../utils/traceMethods');

class DeviceAllocator {
  /**
   * @param {AllocationDriverBase} allocationDriver
   */
  constructor(allocationDriver) {
    this._driver = allocationDriver;
    this._counter = 0;
    this._ids = new Map();
    traceMethods(log, this, ['init', 'cleanup', 'emergencyCleanup']);

    // Init and cleanup should be called once for each allocation driver type
    this.init = _.once(this.init.bind(this));
    this.cleanup = _.once(this.cleanup.bind(this));
    this.emergencyCleanup = _.once(this.emergencyCleanup.bind(this));
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
   * @param {Detox.DetoxDeviceConfig} deviceConfig
   * @returns {Promise<DeviceCookie>}
   */
  async allocate(deviceConfig) {
    const tid = this._counter++;
    return await log.trace.complete({ data: deviceConfig, id: tid }, 'allocate', async () => {
      const cookie = await this._driver.allocate(deviceConfig);
      log.debug({ data: cookie }, `settled on ${cookie.name || cookie.id}`);
      this._ids.set(cookie.id, tid);
      return cookie;
    });
  }

  /**
   * @param {DeviceCookie} cookie
   * @returns {Promise<DeviceCookie>}
   */
  async postAllocate(cookie) {
    const tid = this._ids.get(cookie.id);
    return await log.trace.complete({ data: cookie, id: tid }, `post-allocate: ${cookie.id}`, async () => {
      const updatedCookie = typeof this._driver.postAllocate === 'function'
        ? await this._driver.postAllocate(cookie)
        : undefined;

      return updatedCookie || cookie;
    });
  }

  /**
   * @param {DeviceCookie} cookie
   * @param {DeallocOptions} options
   * @returns {Promise<void>}
   */
  async free(cookie, options = {}) {
    const tid = this._ids.get(cookie.id);
    await log.trace.complete({ data: options, id: tid }, `free: ${cookie.id}`, async () => {
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

  isRecoverableError(error) {
    if (typeof this._driver.isRecoverableError !== 'function') {
      return false;
    }
    return this._driver.isRecoverableError(error);
  }
}

module.exports = DeviceAllocator;
