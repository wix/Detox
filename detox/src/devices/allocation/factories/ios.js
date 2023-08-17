// @ts-nocheck
const DeviceAllocatorFactory = require('./base');

class IosSimulator extends DeviceAllocatorFactory {
  _createDriver(deps) {
    const serviceLocator = require('../../../servicelocator/ios');
    const applesimutils = serviceLocator.appleSimUtils;
    const deviceRegistry = serviceLocator.deviceRegistry;

    const SimulatorLauncher = require('../drivers/ios/SimulatorLauncher');
    const simulatorLauncher = new SimulatorLauncher({ applesimutils });

    const SimulatorAllocDriver = require('../drivers/ios/SimulatorAllocDriver');
    return new SimulatorAllocDriver({ deviceRegistry, applesimutils, simulatorLauncher, ...deps });
  }
}

module.exports = { IosSimulator };
