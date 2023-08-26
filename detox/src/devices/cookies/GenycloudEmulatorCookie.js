// @ts-nocheck
const AndroidDeviceCookie = require('./AndroidDeviceCookie');

class GenycloudEmulatorCookie extends AndroidDeviceCookie {
  /**
   * @param instance { GenyInstance }
   */
  constructor(instance) {
    super();
    this.instance = instance;
  }

  get adbName() {
    return this.instance.adbName;
  }

  set adbName(value) {}

  toString() {
    return `${this.instance.uuid} (${this.instance.adbName})`;
  }
}

module.exports = GenycloudEmulatorCookie;
