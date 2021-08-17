const DeviceCookie = require('./DeviceCookie');

class AndroidDeviceCookie extends DeviceCookie {
  constructor(adbName) {
    super();
    this.adbName = adbName;
  }

  get name() {
    return this.adbName;
  }
}

module.exports = AndroidDeviceCookie;
