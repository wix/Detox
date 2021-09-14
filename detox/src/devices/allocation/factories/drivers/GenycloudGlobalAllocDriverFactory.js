class GenycloudGlobalAllocDriverFactory {
  /**
   * @returns { GenyGlobalAllocDriver }
   */
  createGlobalAllocationDriver() {
    const serviceLocator = require('../../../../servicelocator/android');
    const deviceCleanupRegistry = serviceLocator.genycloud.cleanupDeviceRegistry;

    const GenyGlobalAllocDriver = require('../../drivers/android/genycloud/GenyGlobalAllocDriver');
    const getRuntimeDeps = () => {
      const exec = serviceLocator.genycloud.exec;

      const InstanceLifecycleService = require('../../../common/drivers/android/genycloud/services/GenyInstanceLifecycleService');
      const instanceLifecycleService = new InstanceLifecycleService(exec, null);
      return {
        instanceLifecycleService,
      };
    };
    return new GenyGlobalAllocDriver({ deviceCleanupRegistry }, getRuntimeDeps);
  }
}

module.exports = GenycloudGlobalAllocDriverFactory;
