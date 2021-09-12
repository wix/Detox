const AllocationDriverFactory = require('./AllocationDriverFactory');

class GenycloudAllocDriverFactory extends AllocationDriverFactory {
  createAllocationDriver({ eventEmitter }) {
    const serviceLocator = require('../../../../servicelocator/android');
    const adb = serviceLocator.adb;
    const exec = serviceLocator.genycloud.exec;
    const deviceRegistry = serviceLocator.genycloud.runtimeDeviceRegistry;
    const deviceCleanupRegistry = serviceLocator.genycloud.cleanupDeviceRegistry;

    const InstanceNaming = require('../../../common/drivers/android/genycloud/services/GenyInstanceNaming');
    const instanceNaming = new InstanceNaming(); // TODO should consider a permissive impl for debug/dev mode. Maybe even a custom arg in package.json (Detox > ... > genycloud > sharedAccount: false)

    const RecipesService = require('../../../common/drivers/android/genycloud/services/GenyRecipesService');
    const recipeService = new RecipesService(exec);

    const InstanceLookupService = require('../../../common/drivers/android/genycloud/services/GenyInstanceLookupService');
    const instanceLookupService = new InstanceLookupService(exec, instanceNaming, deviceRegistry);

    const InstanceLifecycleService = require('../../../common/drivers/android/genycloud/services/GenyInstanceLifecycleService');
    const instanceLifecycleService = new InstanceLifecycleService(exec, instanceNaming);

    const RecipeQuerying = require('../../drivers/android/genycloud/GenyRecipeQuerying');
    const recipeQuerying = new RecipeQuerying(recipeService);

    const InstanceAllocation = require('../../drivers/android/genycloud/GenyInstanceAllocation');
    const instanceAllocation = new InstanceAllocation({ deviceRegistry, instanceLookupService, instanceLifecycleService });

    const InstanceLauncher = require('../../drivers/android/genycloud/GenyInstanceLauncher');
    const {
      GenyAllocDriver,
      GenyDeallocDriver,
    } = require('../../drivers/android/genycloud/GenyAllocDriver');
    const instanceLauncher = new InstanceLauncher({ instanceLifecycleService, instanceLookupService, deviceCleanupRegistry, eventEmitter });

    const allocDriver = new GenyAllocDriver({
      adb,
      recipeQuerying,
      instanceAllocation,
      instanceLauncher,
    });
    const createDeallocDriver = (deviceCookie) => new GenyDeallocDriver(deviceCookie.instance, { instanceAllocation, instanceLauncher });

    return {
      allocDriver,
      createDeallocDriver,
    }
  }
}

module.exports = GenycloudAllocDriverFactory;
