const AllocationDriverFactory = require('./AllocationDriverFactory');

class IosSimulatorAllocDriverFactory extends AllocationDriverFactory {
  createAllocationDriver({ eventEmitter }) {
    const serviceLocator = require('../../../../servicelocator/ios');
    const applesimutils = serviceLocator.appleSimUtils;
    const deviceRegistry = serviceLocator.deviceRegistry;

    const SimulatorLauncher = require('../../drivers/ios/SimulatorLauncher');
    const simulatorLauncher = new SimulatorLauncher({ applesimutils, eventEmitter });

    const { SimulatorAllocDriver, SimulatorDeallocDriver } = require('../../drivers/ios/SimulatorAllocDriver');
    const allocDriver = new SimulatorAllocDriver({ eventEmitter, deviceRegistry, applesimutils, simulatorLauncher });
    const createDeallocDriver = (deviceCookie) =>
      new SimulatorDeallocDriver(deviceCookie.udid, { deviceRegistry, simulatorLauncher });

    return {
      allocDriver,
      createDeallocDriver,
    };
  }
}

module.exports = IosSimulatorAllocDriverFactory;
