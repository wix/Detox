const DeviceCookie = require('./DeviceCookie');

class GenycloudEmulatorCookie extends DeviceCookie {
  /**
   * @param instance { GenyInstance }
   */
  constructor(instance) {
    super();
    this.instance = instance;
  }
}

module.exports = GenycloudEmulatorCookie;
