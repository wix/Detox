class AllocationDriverBase {
  constructor(eventEmitter) {
    this._eventEmitter = eventEmitter;
  }

  /**
   * @param deviceQuery { Object | String }
   * @return {Promise<DeviceCookie>}
   */
  async allocate(deviceQuery) {}

  // TODO ASDASD possibly relocate to device/instance launcher classes
  async _notifyBootEvent(deviceId, type, coldBoot) {
    return this._eventEmitter.emit('bootDevice', { deviceId, type, coldBoot });
  }
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
