class AllocationDriverBase {
  constructor(eventEmtiter) {
    this._eventEmitter = eventEmtiter;
  }

  /**
   * @param deviceQuery { Object | String }
   * @return {Promise<DeviceCookie>}
   */
  async allocate(deviceQuery) {}

  /**
   * @param cookie { DeviceCookie }
   * @return {Promise<void>}
   */
  async free(cookie) {}

  // TODO ASDASD possibly relocate to device/instance launcher classes
  async _notifyBootEvent(deviceId, type, coldBoot) {
    return this._eventEmitter.emit('bootDevice', { deviceId, type, coldBoot });
  }
}

module.exports = AllocationDriverBase;
