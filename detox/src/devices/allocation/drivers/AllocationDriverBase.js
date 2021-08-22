class AllocationDriverBase {
  /**
   * @param deviceQuery { Object | String }
   * @return {Promise<DeviceCookie>}
   */
  async allocate(deviceQuery) {}
}

class DeallocationDriverBase {
  /**
   * @param options { {shutdown: boolean} }
   * @return {Promise<void>}
   */
  async free(options) {}
}

module.exports = {
  AllocationDriverBase,
  DeallocationDriverBase,
};
