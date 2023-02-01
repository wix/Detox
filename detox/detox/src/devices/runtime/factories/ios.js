const RuntimeDeviceFactory = require('./base');

class RuntimeDriverFactoryIos extends RuntimeDeviceFactory {
  _createDriverDependencies(commonDeps) {
    const serviceLocator = require('../../../servicelocator/ios');
    const applesimutils = serviceLocator.appleSimUtils;
    const { eventEmitter } = commonDeps;

    const SimulatorLauncher = require('../../allocation/drivers/ios/SimulatorLauncher');
    return {
      ...commonDeps,
      applesimutils,
      simulatorLauncher: new SimulatorLauncher({ applesimutils, eventEmitter }),
    };
  }
}

class IosSimulator extends RuntimeDriverFactoryIos {
  _createDriver(deviceCookie, deps, { deviceConfig }) {
    const props = {
      udid: deviceCookie.udid,
      type: deviceConfig.device.type,
      bootArgs: deviceConfig.bootArgs,
      headless: deviceConfig.headless
    };

    const { IosSimulatorRuntimeDriver } = require('../drivers');
    return new IosSimulatorRuntimeDriver(deps, props);
  }
}

module.exports = {
  IosSimulator,
};
