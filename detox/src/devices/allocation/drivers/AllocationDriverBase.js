class AllocationDriverBase {
  /**
   * @param deviceConfig { Object }
   * @return {Promise<DeviceCookie>}
   */
  async allocate(deviceConfig) {} // eslint-disable-line no-unused-vars
}

class DeallocationDriverBase {
  /**
   * @param options { {shutdown: boolean} }
   * @return {Promise<void>}
   */
  async free(options) {} // eslint-disable-line no-unused-vars
}

module.exports = {
  AllocationDriverBase,
  DeallocationDriverBase,
};
