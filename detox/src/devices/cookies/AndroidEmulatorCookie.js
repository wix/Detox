const AndroidDeviceCookie = require('./AndroidDeviceCookie');

class AndroidEmulatorCookie extends AndroidDeviceCookie {
  constructor(adbName, avdName) {
    super(adbName);
    this.avdName = avdName;
  }
}

module.exports = AndroidEmulatorCookie;
