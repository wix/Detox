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

class Ios extends RuntimeDriverFactoryIos {
  _createDriver(deviceCookie, deps, configs) { // eslint-disable-line no-unused-vars
    const { IosRuntimeDriver } = require('../drivers');
    return new IosRuntimeDriver(deps);
  }
}

class IosSimulator extends RuntimeDriverFactoryIos {
  _createDriver(deviceCookie, deps, configs) {
    const { udid } = deviceCookie;

    const { IosSimulatorRuntimeDriver } = require('../drivers');
    return new IosSimulatorRuntimeDriver(udid, deps, configs);
  }
}

module.exports = {
  Ios,
  IosSimulator,
};
