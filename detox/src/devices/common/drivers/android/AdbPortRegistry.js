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
   * @returns { number | undefined }
   */
  getPort(adbName) {
    return this._registry.get(adbName);
  }

  /**
   * @returns { number[] }
   */
  getAllPorts() {
    return this._registry.values().toArray();
  }
}

module.exports = new AdbPortRegistry();
