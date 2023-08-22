/* eslint @typescript-eslint/no-unused-vars: ["error", { "args": "none" }] */
// @ts-nocheck

/**
 * @typedef DeallocOptions
 * @property shutdown { Boolean }
 */

class AllocationDriverBase {
  async init() {}

  /**
   * @param deviceConfig { Object }
   * @return {Promise<DeviceCookie>}
   */
  async allocate(deviceConfig) {}

  /**
   * @param {DeviceCookie} deviceCookie
   * @return {Promise<void>}
   */
  async postAllocate(deviceCookie) {}

  /**
   * @param cookie { DeviceCookie }
   * @param options { DeallocOptions }
   * @return {Promise<void>}
   */
  async free(cookie, options) {}

  async cleanup() {}

  emergencyCleanup() {}
}

module.exports = AllocationDriverBase;
