const DeviceCookie = require('./DeviceCookie');

class AndroidEmulatorCookie extends DeviceCookie {
  constructor(adbName, avdName) {
    super();
    this.adbName = adbName;
    this.name = `${adbName} (${avdName})`
  }
}

module.exports = AndroidEmulatorCookie;
