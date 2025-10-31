class DeviceInitCache {
  constructor() {
    this.cache = new Set();
  }

  isInitialized(deviceId) {
    return this.cache.has(deviceId);
  }

  markInitialized(deviceId) {
    this.cache.add(deviceId);
  }
}

module.exports = DeviceInitCache;
