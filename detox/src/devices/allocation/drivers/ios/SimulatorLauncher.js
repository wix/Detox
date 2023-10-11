class SimulatorLauncher {
  constructor({ applesimutils, eventEmitter }) {
    this._applesimutils = applesimutils;
    this._eventEmitter = eventEmitter;
  }

  async launch(udid, type, bootArgs, headless) {
    const coldBoot = await this._applesimutils.boot(udid, bootArgs, headless);
    return coldBoot;
  }

  async shutdown(udid) {
    if (this._eventEmitter) {
      await this._eventEmitter.emit('beforeShutdownDevice', { deviceId: udid });
    }

    await this._applesimutils.shutdown(udid);

    if (this._eventEmitter) {
      await this._eventEmitter.emit('shutdownDevice', { deviceId: udid });
    }
  }
}

module.exports = SimulatorLauncher;
