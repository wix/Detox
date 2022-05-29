const _ = require('lodash');

const RuntimeDeviceFactory = require('./base');

class RuntimeDriverFactoryIos extends RuntimeDeviceFactory {
  _createDriverDependencies(commonDeps, configs) {
    // TODO (multiapps): Consider relocating the things below (belongs under runtime/)
    const Client = require('../../../client/Client');
    const { InvocationManager } = require('../../../invoke');

    const serviceLocator = require('../../../servicelocator/ios');
    const applesimutils = serviceLocator.appleSimUtils;

    const client = new Client(configs.sessionConfig);
    const invocationManager = new InvocationManager(client);

    const apps = this._createApps(client, invocationManager, configs);

    const { eventEmitter } = commonDeps;

    const SimulatorLauncher = require('../../allocation/drivers/ios/SimulatorLauncher');
    return {
      ...commonDeps,
      apps,
      client,
      invocationManager,
      applesimutils,
      simulatorLauncher: new SimulatorLauncher({ applesimutils, eventEmitter }),
    };
  }

  _createApps(client, invocationManager, { appsConfig }) {
    return _.map(appsConfig, (appConfig, alias) => ({
      alias,
      config: appConfig,
      client,
      invocationManager,
    }));
  }
}

class Ios extends RuntimeDriverFactoryIos {
  _createDriver(deviceCookie, deps) {
    const { IosRuntimeDriver } = require('../drivers');
    return new IosRuntimeDriver(deps);
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
    return new IosSimulatorRuntimeDriver(deps, props);
  }
}

module.exports = {
  Ios,
  IosSimulator,
};
