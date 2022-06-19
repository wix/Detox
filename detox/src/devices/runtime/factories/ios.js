const RuntimeDeviceFactory = require('./base');

class RuntimeDriverFactoryIos extends RuntimeDeviceFactory {
  _createAppDriverDeps({ sessionConfig }) {
    const Client = require('../../../client/Client');
    const { InvocationManager } = require('../../../invoke');

    const client = new Client(sessionConfig);
    const invocationManager = new InvocationManager(client);
    return {
      client,
      invocationManager,
    };
  }
}

class Ios extends RuntimeDriverFactoryIos {
  /** @override */
  _createTestAppDriver(deviceCookie, commonDeps, { sessionConfig }, _alias) {
    const appDeps = this._createAppDriverDeps({ sessionConfig });
    const deps = {
      ...commonDeps,
      ...appDeps,
    };

    const { IosAppDriver } = require('../drivers/ios/IosDrivers');
    return new IosAppDriver(deps);
  }

  /** @override */
  _createDeviceDriver(deviceCookie, commonDeps, _configs) {
    const { IosDeviceDriver } = require('../drivers/ios/IosDrivers');
    return new IosDeviceDriver(commonDeps);
  }
}

class IosSimulator extends RuntimeDriverFactoryIos {
  /** @override */
  _createTestAppDriver(deviceCookie, commonDeps, { deviceConfig, sessionConfig }, _alias) {
    const simulatorDeps = this.__createIosSimulatorDriverDeps(commonDeps);
    const appDeps = this._createAppDriverDeps({ sessionConfig });
    const deps = {
      ...simulatorDeps,
      ...appDeps,
    };

    const props = {
      udid: deviceCookie.udid,
    };

    const { IosSimulatorAppDriver } = require('../drivers/ios/IosSimulatorDrivers');
    return new IosSimulatorAppDriver(deps, props);
  }

  /** @override */
  _createDeviceDriver(deviceCookie, commonDeps, { deviceConfig }) {
    const deps = this.__createIosSimulatorDriverDeps(commonDeps);
    const props = {
      udid: deviceCookie.udid,
      type: deviceConfig.device.type,
      bootArgs: deviceConfig.bootArgs,
    };

    const { IosSimulatorDeviceDriver } = require('../drivers/ios/IosSimulatorDrivers');
    return new IosSimulatorDeviceDriver(deps, props);
  }

  __createIosSimulatorDriverDeps(commonDeps) {
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

module.exports = {
  Ios,
  IosSimulator,
};
