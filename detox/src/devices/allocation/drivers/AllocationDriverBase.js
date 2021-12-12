/**
 * @typedef DeallocOptions
 * @property shutdown { Boolean }
 */

class AllocationDriverBase {
  /**
   * @param deviceConfig { Object }
   * @return {Promise<DeviceCookie>}
   */
  async allocate(deviceConfig) {} // eslint-disable-line no-unused-vars

  /**
   * @param cookie { DeviceCookie }
   * @param options { DeallocOptions }
   * @return {Promise<void>}
   */
  async free(cookie, options) {} // eslint-disable-line no-unused-vars
}

module.exports = AllocationDriverBase;
