const DeviceRegistry = require('../../../DeviceRegistry');
const environment = require('../../../../utils/environment');

class GenyCloudDeviceRegistry {
  constructor(deviceRegistry) {
    this.deviceRegistry = deviceRegistry;
  }

  async allocateDevice(getInstanceFn) {
    let instance;
    await this.deviceRegistry.allocateDevice(async () => {
      instance = await getInstanceFn();
      return instance.uuid;
    });
    return instance;
  }

  async disposeDevice(instance) {
    return this.deviceRegistry.disposeDevice(instance.uuid);
  }

  includes(instance) {
    return this.deviceRegistry.includes(instance.uuid);
  }

  getRegisteredInstanceUUIDs() {
    return this.deviceRegistry.getRegisteredDevices();
  }

  static forGlobalCleanup() {
    return new DeviceRegistry({
      lockfilePath: environment.getGenyCloudPostCleanupFilePath(),
    });
  }
}

module.exports = GenyCloudDeviceRegistry;
