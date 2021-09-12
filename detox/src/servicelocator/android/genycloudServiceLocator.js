const environment = require('../../utils/environment');
const Exec = require('../../devices/common/drivers/android/genycloud/exec/GenyCloudExec');
const DeviceRegistryFactory = require('../../devices/runtime/drivers/android/genycloud/GenyDeviceRegistryFactory');

class GenycloudServiceLocator {
  constructor() {
    this.exec = new Exec(environment.getGmsaasPath());
    this.runtimeDeviceRegistry = DeviceRegistryFactory.forRuntime();
    this.cleanupDeviceRegistry = DeviceRegistryFactory.forGlobalShutdown();
  }
}

module.exports = new GenycloudServiceLocator();
