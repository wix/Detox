const RuntimeDeviceFactory = require('./base');

class RuntimeDriverFactoryIos extends RuntimeDeviceFactory {
  _createDriverDependencies(commonDeps) {
    const serviceLocator = require('../../../servicelocator/ios');
    const applesimutils = serviceLocator.appleSimUtils;

    const SimulatorLauncher = require('../../allocation/drivers/ios/SimulatorLauncher');
    return {
      ...commonDeps,
      applesimutils,
      simulatorLauncher: new SimulatorLauncher({ applesimutils, eventEmitter: commonDeps.emitter }),
    };
  }
}

class Ios extends RuntimeDriverFactoryIos {
}

class IosSimulator extends RuntimeDriverFactoryIos {
  _createDriver(deviceCookie, deps, configs) {
    const { IosSimulatorRuntimeDriver } = require('../drivers');

    const { udid } = deviceCookie;
    return new IosSimulatorRuntimeDriver(udid, deps, configs);
  }
}

module.exports = {
  Ios,
  IosSimulator,
};
