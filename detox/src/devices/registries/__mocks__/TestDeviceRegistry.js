const DeviceRegistry = require('../DeviceRegistry');

class TestDeviceRegistry extends DeviceRegistry {
  constructor({
    deviceRegistryLock,
    createDeviceWithProperties,
    getDevicesWithProperties,
    getRuntimeVersion,
  } = {}) {
    super({ deviceRegistryLock });

    this.createDeviceWithProperties = createDeviceWithProperties;
    this.getDevicesWithProperties = getDevicesWithProperties;
    this.getRuntimeVersion = getRuntimeVersion;
  }
}

module.exports = TestDeviceRegistry;
