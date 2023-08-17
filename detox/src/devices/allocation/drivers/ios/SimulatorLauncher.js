class SimulatorLauncher {
  constructor({ applesimutils }) {
    this._applesimutils = applesimutils;
  }

  async launch(udid, type, bootArgs, headless) {
    const coldBoot = await this._applesimutils.boot(udid, bootArgs, headless);
    return coldBoot;
  }

  async shutdown(udid) {
    await this._applesimutils.shutdown(udid);
  }
}

module.exports = SimulatorLauncher;
