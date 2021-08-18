const DeviceCookie = require('./DeviceCookie');

class IosSimulatorCookie extends DeviceCookie {
  constructor(udid, type) {
    super();
    this.udid = udid;
    this.type = type;
  }
}

module.exports = IosSimulatorCookie;
