const {
  AndroidEmulatorRuntimeDriver,
  GenycloudRuntimeDriver,
  IosSimulatorDriver,
} = require('./drivers');
const {
  IosSimulatorCookie,
  AndroidDeviceCookie,
  AndroidEmulatorCookie,
  GenycloudEmulatorCookie,
} = require('../cookies');
const RuntimeDevice = require('./RuntimeDevice');

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
    return new AndroidEmulatorRuntimeDriver(deviceCookie.adbName, deviceCookie.avdName, driverConfig);
  }
  if (deviceCookie instanceof GenycloudEmulatorCookie) {
    return new GenycloudRuntimeDriver(deviceCookie.instance, driverConfig);
  }
  throw new Error('wuttt'); // TODO ASDASD
}

module.exports = {
  createRuntimeDevice,
};
