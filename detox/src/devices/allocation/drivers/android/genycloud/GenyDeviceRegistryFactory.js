const environment = require('../../../../../utils/environment');
const DeviceRegistry = require('../../../../DeviceRegistry');

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
