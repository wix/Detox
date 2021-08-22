const {
  AndroidEmulatorRuntimeDriver,
  GenycloudRuntimeDriver,
  IosSimulatorDriver,
} = require('./drivers');
const {
  IosSimulatorCookie,
  AndroidDeviceCookie, // TODO ASDASD
  AndroidEmulatorCookie,
  GenycloudEmulatorCookie,
} = require('../cookies');
const RuntimeDevice = require('./RuntimeDevice');
const AppleSimUtils = require('../common/drivers/ios/tools/AppleSimUtils');
const SimulatorLauncher = require('../allocation/drivers/ios/SimulatorLauncher');

/**
 * @param deviceCookie { DeviceCookie }
 * @param driverConfig { Object }
 * @param deviceArgs { Object } // TODO ASDASD Own the creation of invocation manager, etc?
 * @returns { RuntimeDevice }
 */
function createRuntimeDevice(deviceCookie, driverConfig, deviceArgs) {
  const runtimeDriver = _createDriver(deviceCookie, driverConfig);
  return new RuntimeDevice(deviceArgs, runtimeDriver);
}

function _createDriver(deviceCookie, driverConfig) {
  if (deviceCookie instanceof AndroidEmulatorCookie) {
    const { adbName, avdName } = deviceCookie;
    return new AndroidEmulatorRuntimeDriver(adbName, avdName, driverConfig);
  }

  if (deviceCookie instanceof GenycloudEmulatorCookie) {
    return new GenycloudRuntimeDriver(deviceCookie.instance, driverConfig);
  }

  if (deviceCookie instanceof IosSimulatorCookie) {
    const eventEmitter = driverConfig.emitter;
    const applesimutils = new AppleSimUtils();
    const iosDriverConfig = {
      ...driverConfig,
      applesimutils,
      simulatorLauncher: new SimulatorLauncher({ applesimutils, eventEmitter }),
    };
    const { udid, type } = deviceCookie;
    return new IosSimulatorDriver(udid, type, iosDriverConfig);
  }

  throw new Error('wuttt'); // TODO ASDASD
}

module.exports = {
  createRuntimeDevice,
};
