const DeviceCookie = require('./DeviceCookie');

class AndroidDeviceCookie extends DeviceCookie {
  /**
   * @param adbName { String }
   */
  constructor(adbName) {
    super();
    this.adbName = adbName;
  }

  toString() {
    return this.adbName;
  }
}

module.exports = AndroidDeviceCookie;
