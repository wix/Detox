const DeviceHandle = require('./DeviceHandle');
const EmulatorTelnet = require('./EmulatorTelnet');

class EmulatorHandle extends DeviceHandle {
  constructor(deviceString) {
    super(deviceString);
    this._telnet = new EmulatorTelnet();

    this.port = this.adbName.split('-')[1];
  }

  /* async */ queryName() {
    if (!this._namePromise) {
      this._namePromise = this._queryNameViaTelnet();
    }
    return this._namePromise;
  }

  async _queryNameViaTelnet() {
    await this._telnet.connect(this.port);
    try {
      return await this._telnet.avdName();
    } finally {
      await this._telnet.quit();
    }
  }
}

module.exports = EmulatorHandle;
