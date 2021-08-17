const AndroidDeviceCookie = require('./AndroidDeviceCookie');

class AndroidEmulatorCookie extends AndroidDeviceCookie {
  constructor(adbName, avdName) {
    super(adbName);
    this._name = `${adbName} (${avdName})`
  }

  get name() {
    return this._name;
  }
}

module.exports = AndroidEmulatorCookie;
