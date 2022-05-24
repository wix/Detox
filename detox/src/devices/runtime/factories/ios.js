// TODO (multiapps): Consider relocating the things below (belongs under runtime/)
const Client = require('../../../client/Client');
const { InvocationManager } = require('../../../invoke');

const RuntimeDeviceFactory = require('./base');

class RuntimeDriverFactoryIos extends RuntimeDeviceFactory {
  _createDriverDependencies(commonDeps, { sessionConfig }) {
    const serviceLocator = require('../../../servicelocator/ios');
    const applesimutils = serviceLocator.appleSimUtils;
    const client = new Client(sessionConfig);
    const invocationManager = new InvocationManager(client);

    const { eventEmitter } = commonDeps;

    const SimulatorLauncher = require('../../allocation/drivers/ios/SimulatorLauncher');
    return {
      ...commonDeps,
      client,
      invocationManager,
      applesimutils,
      simulatorLauncher: new SimulatorLauncher({ applesimutils, eventEmitter }),
    };
  }
}

class Ios extends RuntimeDriverFactoryIos {
  _createDriver(deviceCookie, deps, configs) { // eslint-disable-line no-unused-vars
    const { IosRuntimeDriver } = require('../drivers');
    return new IosRuntimeDriver(deps, configs);
  }
}

class IosSimulator extends RuntimeDriverFactoryIos {
  _createDriver(deviceCookie, deps, configs) {
    const { deviceConfig } = configs;
    const props = {
      udid: deviceCookie.udid,
      type: deviceConfig.device.type,
      bootArgs: deviceConfig.bootArgs,
    };

    const { IosSimulatorRuntimeDriver } = require('../drivers');
    return new IosSimulatorRuntimeDriver(deps, configs, props);
  }
}

module.exports = {
  Ios,
  IosSimulator,
};
