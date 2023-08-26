// @ts-nocheck
const DeviceAllocatorFactory = require('./base');

class AndroidEmulator extends DeviceAllocatorFactory {
  _createDriver({ detoxSession, detoxConfig }) {
    const serviceLocator = require('../../servicelocator/android');
    const adb = serviceLocator.adb;
    const emulatorExec = serviceLocator.emulator.exec;
    const DeviceRegistry = require('../../allocation/DeviceRegistry');
    const deviceRegistry = new DeviceRegistry({ sessionId: detoxSession.sessionId });

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

    const EmulatorAllocDriver = require('../drivers/android/emulator/EmulatorAllocDriver');
    return new EmulatorAllocDriver({
      adb,
      avdValidator,
      detoxConfig,
      deviceRegistry,
      emulatorVersionResolver,
      emulatorLauncher,
      freeEmulatorFinder,
    });
  }
}

class AndroidAttached extends DeviceAllocatorFactory {
  _createDriver({ detoxSession, detoxConfig }) {
    const serviceLocator = require('../../servicelocator/android');
    const adb = serviceLocator.adb;
    const DeviceRegistry = require('../../allocation/DeviceRegistry');
    const deviceRegistry = new DeviceRegistry({ sessionId: detoxSession.sessionId });

    const FreeDeviceFinder = require('../drivers/android/FreeDeviceFinder');
    const freeDeviceFinder = new FreeDeviceFinder(adb, deviceRegistry);

    const AttachedAndroidAllocDriver = require('../drivers/android/attached/AttachedAndroidAllocDriver');
    return new AttachedAndroidAllocDriver({ adb, deviceRegistry, freeDeviceFinder });
  }
}

class Genycloud extends DeviceAllocatorFactory {
  _createDriver(deps) {
    const serviceLocator = require('../../servicelocator/android');
    const adb = serviceLocator.adb;
    const exec = serviceLocator.genycloud.exec;

    const InstanceNaming = require('../drivers/android/genycloud/services/GenyInstanceNaming');
    const instanceNaming = new InstanceNaming(); // TODO should consider a permissive impl for debug/dev mode. Maybe even a custom arg in package.json (Detox > ... > genycloud > sharedAccount: false)

    const RecipesService = require('../drivers/android/genycloud/services/GenyRecipesService');
    const recipeService = new RecipesService(exec);

    const InstanceLifecycleService = require('../drivers/android/genycloud/services/GenyInstanceLifecycleService');
    const instanceLifecycleService = new InstanceLifecycleService(exec, instanceNaming);

    const RecipeQuerying = require('../drivers/android/genycloud/GenyRecipeQuerying');
    const recipeQuerying = new RecipeQuerying(recipeService);

    const InstanceLauncher = require('../drivers/android/genycloud/GenyInstanceLauncher');
    const instanceLauncher = new InstanceLauncher({ genyCloudExec: exec, instanceLifecycleService });

    const GenyAllocDriver = require('../drivers/android/genycloud/GenyAllocDriver');

    return new GenyAllocDriver({
      adb,
      instanceLauncher,
      instanceLifecycleService,
      recipeQuerying,
      ...deps,
    });
  }
}

module.exports = {
  AndroidEmulator,
  AndroidAttached,
  Genycloud,
};
