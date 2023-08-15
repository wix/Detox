class SimulatorLauncher {
  constructor({ applesimutils }) {
    this._applesimutils = applesimutils;
  }

  // TODO: think if we can report about cold/hot boot
  async launch(udid, type, bootArgs, headless) {
    await this._applesimutils.boot(udid, bootArgs, headless);
  }

  async shutdown(udid) {
    await this._applesimutils.shutdown(udid);
  }
}

module.exports = SimulatorLauncher;
