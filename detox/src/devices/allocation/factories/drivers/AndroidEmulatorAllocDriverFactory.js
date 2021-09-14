const AllocationDriverFactory = require('./AllocationDriverFactory');

class AndroidEmulatorAllocDriverFactory extends AllocationDriverFactory {
  createAllocationDriver({ eventEmitter }) {
    const serviceLocator = require('../../../../servicelocator/android');
    const adb = serviceLocator.adb;
    const emulatorExec = serviceLocator.emulator.exec;
    const deviceRegistry = serviceLocator.deviceRegistry;

    const AVDsResolver = require('../../drivers/android/emulator/AVDsResolver');
    const avdsResolver = new AVDsResolver(emulatorExec);

    const EmulatorVersionResolver = require('../../drivers/android/emulator/EmulatorVersionResolver');
    const emulatorVersionResolver = new EmulatorVersionResolver(emulatorExec);

    const AVDValidator = require('../../drivers/android/emulator/AVDValidator');
    const avdValidator = new AVDValidator(avdsResolver, emulatorVersionResolver);

    const FreeEmulatorFinder = require('../../drivers/android/emulator/FreeEmulatorFinder');
    const freeEmulatorFinder = new FreeEmulatorFinder(adb, deviceRegistry);

    const EmulatorLauncher = require('../../drivers/android/emulator/EmulatorLauncher');
    const emulatorLauncher = new EmulatorLauncher({ adb, emulatorExec, eventEmitter });

    const EmulatorAllocationHelper = require('../../drivers/android/emulator/EmulatorAllocationHelper');
    const allocationHelper = new EmulatorAllocationHelper(deviceRegistry, freeEmulatorFinder);

    const {
      EmulatorAllocDriver,
      EmulatorDeallocDriver,
    } = require('../../drivers/android/emulator/EmulatorAllocDriver');
    const allocDriver = new EmulatorAllocDriver({
      adb,
      avdValidator,
      emulatorVersionResolver,
      emulatorLauncher,
      allocationHelper,
    });
    const createDeallocDriver = (deviceCookie) => new EmulatorDeallocDriver(deviceCookie.adbName, { emulatorLauncher, allocationHelper });

    return {
      allocDriver,
      createDeallocDriver,
    };
  }
}

module.exports = AndroidEmulatorAllocDriverFactory;
