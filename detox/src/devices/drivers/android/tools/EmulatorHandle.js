const DeviceHandle = require('./DeviceHandle');
const EmulatorTelnet = require('./EmulatorTelnet');

class EmulatorHandle extends DeviceHandle {
  constructor(deviceString) {
    super(deviceString);

    this.port = this.adbName.split('-')[1];
  }

  queryName() {
    if (!this._name) {
      this._name = this._queryNameViaTelnet();
    }

    return this._name;
  }

  async _queryNameViaTelnet() {
    const telnet = new EmulatorTelnet();

    await telnet.connect(this.port);
    try {
      return await telnet.avdName();
    } finally {
      await telnet.quit();
    }
  }
}

module.exports = EmulatorHandle;
