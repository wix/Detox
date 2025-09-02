const deviceInitCache = new Set();

module.exports = {
  isInitialized: (deviceId) => deviceInitCache.has(deviceId),
  markInitialized: (deviceId) => deviceInitCache.add(deviceId),
};
