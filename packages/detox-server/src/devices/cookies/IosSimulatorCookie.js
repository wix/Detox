const IosCookie = require('./IosCookie');

class IosSimulatorCookie extends IosCookie {
  constructor(udid) {
    super();
    this.udid = udid;
  }
}

module.exports = IosSimulatorCookie;
