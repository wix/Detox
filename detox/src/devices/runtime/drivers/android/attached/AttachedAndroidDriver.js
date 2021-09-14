const AndroidDriver = require('../AndroidDriver');

class AttachedAndroidDriver extends AndroidDriver {
  /**
   * @param adbName { String } The unique identifier associated with ADB
   * @param deps { Object }
   */
  constructor(adbName, deps) {
    super(adbName, deps);
  }

  getDeviceName() {
    return `AttachedDevice:${this.adbName}`;
  }
}

module.exports = AttachedAndroidDriver;
