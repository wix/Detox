const AndroidDeviceCookie = require('./AndroidDeviceCookie');

class AndroidEmulatorCookie extends AndroidDeviceCookie {
  /**
   * @param adbName { String }
   * @param avdName { String }
   */
  constructor(adbName, avdName) {
    super(adbName);
    this.avdName = avdName;
  }
}

module.exports = AndroidEmulatorCookie;
