const AndroidDriver = require('../AndroidDriver');

class AttachedAndroidDriver extends AndroidDriver {
  /**
   * @param deps { Object }
   * @param adbName { String } The unique identifier associated with ADB
   */
  constructor(deps, adbName) {
    super(deps, adbName);
  }

  getDeviceName() {
    return `AttachedDevice:${this.adbName}`;
  }
}

module.exports = AttachedAndroidDriver;
