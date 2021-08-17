const DeviceCookie = require('./DeviceCookie');

class IosSimulatorCookie extends DeviceCookie {
  constructor(udid) {
    super();
    this.udid = udid;
  }

  get name() {
    return this.udid;
  }
}

module.exports = IosSimulatorCookie;
