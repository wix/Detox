const DeviceCookie = require('./DeviceCookie');

class AndroidDeviceCookie extends DeviceCookie {
  constructor(adbName) {
    super();
    this.adbName = adbName;
  }
}

module.exports = AndroidDeviceCookie;
