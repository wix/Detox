const DeviceCookie = require('./DeviceCookie');

class GenycloudEmulatorCookie extends DeviceCookie {

  /**
   * @param instance { GenyInstance }
   * @param recipe { GenyRecipe }
   */
  constructor(instance, recipe) {
    super();
    this.instance = instance;
  }

  get name() {
    return this.instance.name();
  }
}

module.exports = GenycloudEmulatorCookie;
