// @ts-nocheck
const DeviceAllocatorFactory = require('./base');

class AndroidEmulator extends DeviceAllocatorFactory {
  _createDriver(deps) {
    const serviceLocator = require('../../../servicelocator/android');
    const adb = serviceLocator.adb;
    const emulatorExec = serviceLocator.emulator.exec;
    const deviceRegistry = serviceLocator.deviceRegistry;

    const AVDsResolver = require('../drivers/android/emulator/AVDsResolver');
    const avdsResolver = new AVDsResolver(emulatorExec);

    const EmulatorVersionResolver = require('../drivers/android/emulator/EmulatorVersionResolver');
    const emulatorVersionResolver = new EmulatorVersionResolver(emulatorExec);

    const AVDValidator = require('../drivers/android/emulator/AVDValidator');
    const avdValidator = new AVDValidator(avdsResolver, emulatorVersionResolver);

    const FreeEmulatorFinder = require('../drivers/android/emulator/FreeEmulatorFinder');
    const freeEmulatorFinder = new FreeEmulatorFinder(adb, deviceRegistry);

    const EmulatorLauncher = require('../drivers/android/emulator/EmulatorLauncher');
    const emulatorLauncher = new EmulatorLauncher({ adb, emulatorExec });

    const EmulatorAllocationHelper = require('../drivers/android/emulator/EmulatorAllocationHelper');
    const allocationHelper = new EmulatorAllocationHelper(deviceRegistry, freeEmulatorFinder);

    const EmulatorAllocDriver = require('../drivers/android/emulator/EmulatorAllocDriver');
    return new EmulatorAllocDriver({
      adb,
      avdValidator,
      emulatorVersionResolver,
      emulatorLauncher,
      allocationHelper,
      ...deps,
    });
  }
}

class AndroidAttached extends DeviceAllocatorFactory {
  _createDriver(deps) {
    const serviceLocator = require('../../../servicelocator/android');
    const adb = serviceLocator.adb;
    const deviceRegistry = serviceLocator.deviceRegistry;

    const FreeDeviceFinder = require('../../common/drivers/android/tools/FreeDeviceFinder');
    const freeDeviceFinder = new FreeDeviceFinder(adb, deviceRegistry);

    const AttachedAndroidAllocDriver = require('../drivers/android/attached/AttachedAndroidAllocDriver');
    return new AttachedAndroidAllocDriver({ adb, deviceRegistry, freeDeviceFinder, ...deps });
  }
}

class Genycloud extends DeviceAllocatorFactory {
  _createDriver(deps) {
    const serviceLocator = require('../../../servicelocator/android');
    const adb = serviceLocator.adb;
    const exec = serviceLocator.genycloud.exec;
    const deviceRegistry = serviceLocator.genycloud.runtimeDeviceRegistry;
    const deviceCleanupRegistry = serviceLocator.genycloud.cleanupDeviceRegistry;

    const InstanceNaming = require('../../common/drivers/android/genycloud/services/GenyInstanceNaming');
    const instanceNaming = new InstanceNaming(); // TODO should consider a permissive impl for debug/dev mode. Maybe even a custom arg in package.json (Detox > ... > genycloud > sharedAccount: false)

    const RecipesService = require('../drivers/android/genycloud/GenyRecipesService');
    const recipeService = new RecipesService(exec);

    const InstanceLookupService = require('../../common/drivers/android/genycloud/services/GenyInstanceLookupService');
    const instanceLookupService = new InstanceLookupService(exec, instanceNaming, deviceRegistry);

    const InstanceLifecycleService = require('../drivers/android/genycloud/GenyInstanceLifecycleService');
    const instanceLifecycleService = new InstanceLifecycleService(exec, instanceNaming);

    const RecipeQuerying = require('../drivers/android/genycloud/GenyRecipeQuerying');
    const recipeQuerying = new RecipeQuerying(recipeService);

    const InstanceAllocationHelper = require('../drivers/android/genycloud/GenyInstanceAllocationHelper');
    const allocationHelper = new InstanceAllocationHelper({ deviceRegistry, instanceLookupService, instanceLifecycleService });

    const InstanceLauncher = require('../drivers/android/genycloud/GenyInstanceLauncher');
    const GenyAllocDriver = require('../drivers/android/genycloud/GenyAllocDriver');
    const instanceLauncher = new InstanceLauncher({ instanceLifecycleService, instanceLookupService, deviceCleanupRegistry });
    return new GenyAllocDriver({
      adb,
      recipeQuerying,
      allocationHelper,
      instanceLauncher,
      ...deps,
    });
  }
}

module.exports = {
  AndroidEmulator,
  AndroidAttached,
  Genycloud,
};
