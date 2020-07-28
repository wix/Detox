const DeviceHandle = require('./DeviceHandle');
const EmulatorTelnet = require('./EmulatorTelnet');

class EmulatorHandle extends DeviceHandle {
  constructor(deviceString) {
    super(deviceString);

    this.telnet = new EmulatorTelnet();
    this.port = this.adbName.split('-')[1];
  }

  async queryName() {
    if (!this._name) {
      this._name = await this._queryNameViaTelnet();
    }
    return this._name;
  }

  async _queryNameViaTelnet() {
    await this.telnet.connect(this.port);
    try {
      return await this.telnet.avdName();
    } finally {
      await this.telnet.quit();
    }
  }
}

module.exports = EmulatorHandle;
