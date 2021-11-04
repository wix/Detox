const DeviceLauncher = require('../../../common/drivers/DeviceLauncher');

class SimulatorLauncher extends DeviceLauncher {
  constructor({ applesimutils, eventEmitter }) {
    super(eventEmitter);
    this._applesimutils = applesimutils;
  }

  async launch(udid, type, bootArgs) {
    const coldBoot = await this._applesimutils.boot(udid, bootArgs);
    await this._notifyBootEvent(udid, type, coldBoot);
  }

  async shutdown(udid) {
    await this._notifyPreShutdown(udid);
    await this._applesimutils.shutdown(udid);
    await this._notifyShutdownCompleted(udid);
  }
}

module.exports = SimulatorLauncher;
