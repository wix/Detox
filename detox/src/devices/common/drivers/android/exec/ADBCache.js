class ADBCache {
  constructor(initialCaches = {}) {
    this.apiLevels = initialCaches.apiLevels || new Map();
  }

  static instance = new ADBCache();
}

module.exports = ADBCache;
