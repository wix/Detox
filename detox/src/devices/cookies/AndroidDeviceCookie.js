const DeviceCookie = require('./DeviceCookie');

class AndroidDeviceCookie extends DeviceCookie {
  /**
   * @param adbName { String }
   */
  constructor(adbName) {
    super();
    this.adbName = adbName;
  }

  get platform() {
    return 'android';
  }
}

module.exports = AndroidDeviceCookie;
