class GenyGlobalLifecycleHandlerFactory {
  /**
   * @returns { GenyGlobalLifecycleHandler }
   */
  createHandler() {
    const serviceLocator = require('../../../servicelocator/android');
    const deviceCleanupRegistry = serviceLocator.genycloud.cleanupDeviceRegistry;
    const exec = serviceLocator.genycloud.exec;

    const InstanceLifecycleService = require('../../common/drivers/android/genycloud/services/GenyInstanceLifecycleService');
    const instanceLifecycleService = new InstanceLifecycleService(exec, null);

    const GenyGlobalLifecycleHandler = require('../GenyGlobalLifecycleHandler');
    return new GenyGlobalLifecycleHandler({ deviceCleanupRegistry, instanceLifecycleService });
  }
}

module.exports = GenyGlobalLifecycleHandlerFactory;
