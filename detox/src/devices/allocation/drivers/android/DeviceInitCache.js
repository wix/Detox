class DeviceInitCache {
  constructor() {
    this._cache = new Map();
  }

  /**
   * @param {string} adbName
   * @returns {boolean}
   */
  hasInitialized(adbName) {
    return this._cache.get(adbName) === true;
  }

  /** @param {string} adbName */
  setInitialized(adbName) {
    this._cache.set(adbName, true);
  }
}

module.exports = DeviceInitCache;

