const RuntimeDevice = require('../RuntimeDevice');
const {
  AndroidEmulatorRuntimeDriverFactory,
  AttachedAndroidRuntimeDriverFactory,
  GenycloudRuntimeDriverFactory,
  IosRuntimeDriverFactory,
  IosSimulatorRuntimeDriverFactory,
  ExternalRuntimeDriverFactory,
} = require('./drivers');

class RuntimeDeviceFactoryBase {
  /**
   * @param driverFactory { RuntimeDriverFactory }
   */
  constructor(driverFactory) {
    this._driverFactory = driverFactory;
  }

  createRuntimeDevice(deviceCookie, commonDeps, configs) {
    const runtimeDriver = this._driverFactory.createDriver(deviceCookie, commonDeps);
    return new RuntimeDevice({ ...commonDeps, ...configs }, runtimeDriver);
  }
}

class AndroidEmulatorFactory extends RuntimeDeviceFactoryBase {
  constructor() {
    super(new AndroidEmulatorRuntimeDriverFactory());
  }
}

class AttachedAndroidFactory extends RuntimeDeviceFactoryBase {
  constructor() {
    super(new AttachedAndroidRuntimeDriverFactory());
  }
}

class GenycloudFactory extends RuntimeDeviceFactoryBase {
  constructor() {
    super(new GenycloudRuntimeDriverFactory());
  }
}

class IosFactory extends RuntimeDeviceFactoryBase {
  constructor() {
    super(new IosRuntimeDriverFactory());
  }
}

class IosSimulatorFactory extends RuntimeDeviceFactoryBase {
  constructor() {
    super(new IosSimulatorRuntimeDriverFactory());
  }
}

class ExternalFactory extends RuntimeDeviceFactoryBase {
  static validateModule(module, path) {
    ExternalRuntimeDriverFactory.validateModule(module, path);
  }

  constructor(module, path) {
    super(new ExternalRuntimeDriverFactory(module, path));
  }
}

module.exports = {
  AndroidEmulatorFactory,
  AttachedAndroidFactory,
  GenycloudFactory,
  IosFactory,
  IosSimulatorFactory,
  ExternalFactory,
};
