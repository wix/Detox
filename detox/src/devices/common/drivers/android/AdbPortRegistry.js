class AdbPortRegistry {
  constructor() {
    this._registry = new Map();
  }

  /**
   * @param { string } adbName
   * @param { number } port
   */
  register(adbName, port) {
    this._registry.set(adbName, port);
  }

  /**
   * @param { string } adbName
   */
  unregister(adbName) {
    this._registry.delete(adbName);
  }

  /**
   * @param { string } adbName
   * @returns { number | undefined }
   */
  getPort(adbName) {
    return this._registry.get(adbName);
  }
}

module.exports = new AdbPortRegistry();
