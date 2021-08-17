const environment = require('../../utils/environment');

/**
 * @param deviceConfig
 * @param eventEmitter
 * @returns { AllocationDriverBase }
 */
function createAllocationDriver(deviceConfig, eventEmitter) {
  switch (deviceConfig.type) {
    case 'android.emulator':
      return _createEmulatorAllocationDriver(eventEmitter);
    case 'android.genycloud':
      return _createGenycloudAllocationDriver(eventEmitter);
    default:
      break; // TODO ASDASD
  }
}

function _createEmulatorAllocationDriver(eventEmitter) {
  const ADB = require('../drivers/android/exec/ADB');
  const { EmulatorExec } = require('../drivers/android/exec/EmulatorExec');
  const AVDsResolver = require('./drivers/emulator/AVDsResolver');
  const EmulatorVersionResolver = require('./drivers/emulator/EmulatorVersionResolver');
  const AVDValidator = require('./drivers/emulator/AVDValidator');
  const FreeEmulatorFinder = require('./drivers/emulator/FreeEmulatorFinder');
  const EmulatorLauncher = require('./drivers/emulator/EmulatorLauncher');
  const EmulatorDeviceAllocation = require('./drivers/emulator/EmulatorDeviceAllocation');
  const DeviceRegistryFactory = require('../drivers/android/genycloud/GenyDeviceRegistryFactory');
  const AllocationDriver = require('./drivers/emulator/EmulatorAllocDriver');

  const adb = new ADB();
  const emulatorExec = new EmulatorExec();

  const avdsResolver = new AVDsResolver(emulatorExec);
  const emulatorVersionResolver = new EmulatorVersionResolver(emulatorExec);
  const avdValidator = new AVDValidator(avdsResolver, emulatorVersionResolver);
  const deviceRegistry = DeviceRegistryFactory.forRuntime();

  const freeEmulatorFinder = new FreeEmulatorFinder(adb, deviceRegistry);
  const emulatorLauncher = new EmulatorLauncher({ adb, emulatorExec, eventEmitter });
  const deviceAllocation = new EmulatorDeviceAllocation(deviceRegistry, freeEmulatorFinder);
  return new AllocationDriver({
    adb,
    eventEmitter,
    avdValidator,
    emulatorVersionResolver,
    emulatorLauncher,
    deviceAllocation,
  });
}

function _createGenycloudAllocationDriver(eventEmitter) {
  const ADB = require('../drivers/android/exec/ADB');
  const Exec = require('../drivers/android/genycloud/exec/GenyCloudExec')
  const InstanceNaming = require('../drivers/android/genycloud/services/GenyInstanceNaming');
  const RecipesService = require('../drivers/android/genycloud/services/GenyRecipesService');
  const InstanceLookupService = require('../drivers/android/genycloud/services/GenyInstanceLookupService');
  const InstanceLifecycleService = require('../drivers/android/genycloud/services/GenyInstanceLifecycleService');

  const RecipeQuerying = require('./drivers/genycloud/GenyRecipeQuerying');
  const InstanceAllocation = require('./drivers/genycloud/GenyInstanceAllocation');
  const InstanceLauncher = require('./drivers/genycloud/GenyInstanceLauncher');
  const DeviceRegistryFactory = require('../drivers/android/genycloud/GenyDeviceRegistryFactory');
  const AllocationDriver = require('./drivers/genycloud/GenycloudAllocDriver');

  const adb = new ADB();
  const genycloudExec = new Exec(environment.getGmsaasPath());
  const instanceNaming = new InstanceNaming(); // TODO should consider a permissive impl for debug/dev mode. Maybe even a custom arg in package.json (Detox > ... > genycloud > sharedAccount: false)
  const deviceRegistry = DeviceRegistryFactory.forRuntime();
  const deviceCleanupRegistry = DeviceRegistryFactory.forGlobalShutdown();

  const recipeService = new RecipesService(genycloudExec);
  const instanceLookupService = new InstanceLookupService(genycloudExec, instanceNaming, deviceRegistry);
  const instanceLifecycleService = new InstanceLifecycleService(genycloudExec, instanceNaming);
  const recipeQuerying = new RecipeQuerying(recipeService);
  const instanceAllocation = new InstanceAllocation({ deviceRegistry, instanceLookupService, instanceLifecycleService });
  const instanceLauncher = new InstanceLauncher(instanceLifecycleService, instanceLookupService, deviceCleanupRegistry, eventEmitter);
  return new AllocationDriver({
    adb,
    eventEmitter,
    recipeQuerying,
    instanceAllocation,
    instanceLauncher,
  });
}

module.exports = {
  createAllocationDriver,
};
