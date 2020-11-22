const DeviceRegistry = require('../../../DeviceRegistry');
const environment = require('../../../../utils/environment');

class GenyDeviceRegistryFactory {
  forRuntime() {
    return DeviceRegistry.forAndroid();
  }

  forGlobalShutdown() {
    return new DeviceRegistry({
      lockfilePath: environment.getGenyCloudGlobalCleanupFilePath(),
    });
  }
}

module.exports = new GenyDeviceRegistryFactory();
