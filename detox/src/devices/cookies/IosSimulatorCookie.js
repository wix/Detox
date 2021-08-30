const IosCookie = require('./IosCookie');

class IosSimulatorCookie extends IosCookie {
  constructor(udid, type) {
    super();
    this.udid = udid;
    this.type = type;
  }
}

module.exports = IosSimulatorCookie;
