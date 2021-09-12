const AllocationDriverFactory = require('./AllocationDriverFactory');

class AttachedAndroidAllocDriverFactory extends AllocationDriverFactory {
  createAllocationDriver({ eventEmitter }) {
    const serviceLocator = require('../../../../servicelocator/android');
    const adb = serviceLocator.adb();
    const deviceRegistry = serviceLocator.deviceRegistry();

    const FreeDeviceFinder = require('../../../common/drivers/android/tools/FreeDeviceFinder');
    const freeDeviceFinder = new FreeDeviceFinder(adb, deviceRegistry);

    const AttachedAndroidLauncher = require('../../drivers/android/attached/AttachedAndroidLauncher');
    const attachedAndroidLauncher = new AttachedAndroidLauncher(eventEmitter);

    const {
      AttachedAndroidAllocDriver,
      AttachedAndroidDeallocDriver,
    } = require('../../drivers/android/attached/AttachedAndroidAllocDriver');
    const allocDriver = new AttachedAndroidAllocDriver({ adb, deviceRegistry, freeDeviceFinder, attachedAndroidLauncher });
    const createDeallocDriver = (deviceCookie) =>
      new AttachedAndroidDeallocDriver(deviceCookie.adbName, { deviceRegistry });

    return {
      allocDriver,
      createDeallocDriver,
    }
  }
}

module.exports = AttachedAndroidAllocDriverFactory;
