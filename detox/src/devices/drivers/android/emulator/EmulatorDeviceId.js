const AndroidDeviceId = require('../AndroidDeviceId');

class EmulatorDeviceId extends AndroidDeviceId {
  constructor(avdName, adbName) {
    super(adbName);
    this.avdName = avdName;
  }

  toString() {
    return `${this.adbName} (${this.avdName})`;
  }
}

module.exports = EmulatorDeviceId;
