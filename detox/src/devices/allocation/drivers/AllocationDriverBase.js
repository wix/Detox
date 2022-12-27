/* eslint @typescript-eslint/no-unused-vars: ["error", { "args": "none" }] */
// @ts-nocheck

/**
 * @typedef DeallocOptions
 * @property shutdown { Boolean }
 */

class AllocationDriverBase {
  /**
   * @param deviceConfig { Object }
   * @return {Promise<DeviceCookie>}
   */
  async allocate(deviceConfig) {}

  /**
   * @param cookie { DeviceCookie }
   * @param options { DeallocOptions }
   * @return {Promise<void>}
   */
  async free(cookie, options) {}
}

module.exports = AllocationDriverBase;
