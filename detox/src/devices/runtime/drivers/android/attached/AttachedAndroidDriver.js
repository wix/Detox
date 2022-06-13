const AndroidDriver = require('../AndroidDriver');

class AttachedAndroidDriver extends AndroidDriver {
  /** @override */
  get deviceName() {
    return `AttachedDevice:${this.adbName}`;
  }
}

module.exports = AttachedAndroidDriver;
