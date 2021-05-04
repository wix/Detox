const DeviceId = require('../DeviceIdentifier');

class AndroidDeviceId extends DeviceId {
  constructor(adbName) {
    super();
    this.adbName = adbName;
  }

  get id() {
    return this.adbName;
  }

  toString() {
    return this.adbName;
  }
}

module.exports = AndroidDeviceId;
