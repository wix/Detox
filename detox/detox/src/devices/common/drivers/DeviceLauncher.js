class DeviceLauncher {
  constructor(eventEmitter) {
    this._eventEmitter = eventEmitter;
  }

  async _notifyPreShutdown(deviceId) {
    return this._eventEmitter.emit('beforeShutdownDevice', { deviceId });
  }

  async _notifyShutdownCompleted(deviceId) {
    return this._eventEmitter.emit('shutdownDevice', { deviceId });
  }

  async _notifyBootEvent(deviceId, type, coldBoot, headless) {
    return this._eventEmitter.emit('bootDevice', { deviceId, type, coldBoot, headless });
  }
}

module.exports = DeviceLauncher;
