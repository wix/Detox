const AndroidDeviceCookie = require('./AndroidDeviceCookie');

class AttachedAndroidDeviceCookie extends AndroidDeviceCookie {
  /**
   * @param adbName { String }
   */
  constructor(adbName) {
    super(adbName);
  }
}

module.exports = AttachedAndroidDeviceCookie;
