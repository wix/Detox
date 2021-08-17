const environment = require('../../utils/environment');
const AllocationDevice = require('./AllocationDevice');

/**
 * @param deviceConfig
 * @param eventEmitter
 * @returns { AllocationDevice }
 */
function createAllocationDevice(deviceConfig, eventEmitter) {
  const driver = _createAllocationDriver(deviceConfig, eventEmitter);
  return new AllocationDevice(driver);
}

function _createAllocationDriver(deviceConfig, eventEmitter) {
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
  const ADB = require('../runtime/drivers/android/exec/ADB');
  const { EmulatorExec } = require('../runtime/drivers/android/exec/EmulatorExec');
  const AVDsResolver = require('./drivers/emulator/AVDsResolver');
  const EmulatorVersionResolver = require('./drivers/emulator/EmulatorVersionResolver');
  const AVDValidator = require('./drivers/emulator/AVDValidator');
  const FreeEmulatorFinder = require('./drivers/emulator/FreeEmulatorFinder');
  const EmulatorLauncher = require('./drivers/emulator/EmulatorLauncher');
  const EmulatorDeviceAllocation = require('./drivers/emulator/EmulatorDeviceAllocation');
  const DeviceRegistryFactory = require('../runtime/drivers/android/genycloud/GenyDeviceRegistryFactory');
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
  const ADB = require('../runtime/drivers/android/exec/ADB');
  const Exec = require('../runtime/drivers/android/genycloud/exec/GenyCloudExec')
  const InstanceNaming = require('../runtime/drivers/android/genycloud/services/GenyInstanceNaming');
  const RecipesService = require('../runtime/drivers/android/genycloud/services/GenyRecipesService');
  const InstanceLookupService = require('../runtime/drivers/android/genycloud/services/GenyInstanceLookupService');
  const InstanceLifecycleService = require('../runtime/drivers/android/genycloud/services/GenyInstanceLifecycleService');
  const DeviceRegistryFactory = require('../runtime/drivers/android/genycloud/GenyDeviceRegistryFactory');

  const RecipeQuerying = require('./drivers/genycloud/GenyRecipeQuerying');
  const InstanceAllocation = require('./drivers/genycloud/GenyInstanceAllocation');
  const InstanceLauncher = require('./drivers/genycloud/GenyInstanceLauncher');
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
  createAllocationDevice,
};
