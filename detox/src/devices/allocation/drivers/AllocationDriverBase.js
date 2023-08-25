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
   * @return {Promise<import('../../cookies/DeviceCookie')>}
   */
  async allocate(deviceConfig) {}

  /**
   * @param {import('../../cookies/DeviceCookie')} deviceCookie
   * @return {Promise<import('../../cookies/DeviceCookie') | void>}
   */
  async postAllocate(deviceCookie) {}

  /**
   * @param cookie { import('../../cookies/DeviceCookie') }
   * @param options { DeallocOptions }
   * @return {Promise<void>}
   */
  async free(cookie, options) {}

  async cleanup() {}

  emergencyCleanup() {}
}

module.exports = AllocationDriverBase;
