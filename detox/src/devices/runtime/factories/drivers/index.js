const {
  AndroidEmulatorRuntimeDriver,
  GenycloudRuntimeDriver,
  AttachedAndroidRuntimeDriver,
  IosSimulatorRuntimeDriver,
} = require('../../drivers');

const AndroidRuntimeDriverFactoryBase = require('./AndroidRuntimeDriverFactoryBase');
const RuntimeDriverFactoryBase = require('./RuntimeDriverFactoryBase');

class AndroidEmulatorRuntimeDriverFactory extends AndroidRuntimeDriverFactoryBase {
  _createDriver(deviceCookie, deps) {
    const { adbName, avdName } = deviceCookie;
    return new AndroidEmulatorRuntimeDriver(adbName, avdName, deps);
  }
}

class GenycloudRuntimeDriverFactory extends AndroidRuntimeDriverFactoryBase {
  _createDriver(deviceCookie, deps) {
    const { instance } = deviceCookie;
    return new GenycloudRuntimeDriver(instance, deps);
  }
}

class AttachedAndroidRuntimeDriverFactory extends AndroidRuntimeDriverFactoryBase {
  _createDriver(deviceCookie, deps) {
    const { adbName } = deviceCookie;
    return new AttachedAndroidRuntimeDriver(adbName, deps);
  }
}

class IosRuntimeDriverFactory extends RuntimeDriverFactoryBase {
  _createDependencies(commonDeps) {
    const serviceLocator = require('../../../../servicelocator/ios');
    const applesimutils = serviceLocator.appleSimUtils;

    const SimulatorLauncher = require('../../../allocation/drivers/ios/SimulatorLauncher');
    return {
      ...commonDeps,
      applesimutils,
      simulatorLauncher: new SimulatorLauncher({ applesimutils, eventEmitter: commonDeps.emitter }),
    };
  }
}

class IosSimulatorRuntimeDriverFactory extends RuntimeDriverFactoryBase {
  _createDriver(deviceCookie, deps) {
    const { udid, type } = deviceCookie;
    return new IosSimulatorRuntimeDriver(udid, type, deps);
  }
}

module.exports = {
  AndroidEmulatorRuntimeDriverFactory,
  AttachedAndroidRuntimeDriverFactory,
  GenycloudRuntimeDriverFactory,
  IosRuntimeDriverFactory,
  IosSimulatorRuntimeDriverFactory,
  ExternalRuntimeDriverFactory: require('./ExternalRuntimeDriverFactory'),
};
