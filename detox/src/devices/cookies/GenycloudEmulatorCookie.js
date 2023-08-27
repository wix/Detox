// @ts-nocheck
const AndroidDeviceCookie = require('./AndroidDeviceCookie');

class GenycloudEmulatorCookie extends AndroidDeviceCookie {
  /**
   * @param instance { GenyInstance }
   */
  constructor(instance) {
    super(instance.adb.name);
    this.instance = instance;
  }

  toString() {
    return `${this.instance}`;
  }
}

module.exports = GenycloudEmulatorCookie;
