const RuntimeDeviceFactory = require('./base');

class RuntimeDriverFactoryIos extends RuntimeDeviceFactory {
  _createDriverDependencies(commonDeps) {
    const AppleSimUtils = require('../../../devices/common/drivers/ios/tools/AppleSimUtils');
    const applesimutils = new AppleSimUtils();

    return {
      ...commonDeps,
      applesimutils,
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
