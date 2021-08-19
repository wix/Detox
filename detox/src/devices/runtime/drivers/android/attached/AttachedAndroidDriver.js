const _ = require('lodash');

const AndroidDriver = require('../AndroidDriver');

class AttachedAndroidDriver extends AndroidDriver {
  /**
   * @param adbName { String }
   * @param config { Object }
   */
  constructor(adbName, config) {
    super(adbName, config);
  }

  getDeviceName() {
    return `AttachedDevice:${this.adbName}`;
  }
}

module.exports = AttachedAndroidDriver;
