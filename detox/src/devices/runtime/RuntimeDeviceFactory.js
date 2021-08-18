const {
  AndroidEmulatorRuntimeDriver,
  GenycloudRuntimeDriver,
  IosSimulatorDriver,
} = require('./drivers');
const RuntimeDevice = require('./RuntimeDevice');

const _driverClasses = {
  'AndroidEmulatorCookie': AndroidEmulatorRuntimeDriver,
  'GenycloudEmulatorCookie': GenycloudRuntimeDriver,
  'IosSimulatorCookie': IosSimulatorDriver,
};

/**
 * @param deviceCookie { DeviceCookie }
 * @param driverArgs { Object }
 * @param deviceArgs { Object } // TODO ASDASD Own the creation of invocation manager, etc?
 * @returns { RuntimeDevice }
 */
function createRuntimeDevice(deviceCookie, driverArgs, deviceArgs) {
  const runtimeDriver = _createDriver(deviceCookie, driverArgs);
  return new RuntimeDevice(deviceArgs, runtimeDriver);
}

function _createDriver(deviceCookie, driverArgs) {
  const RuntimeDriverClass = _driverClasses[deviceCookie.constructor.name];
  if (!RuntimeDriverClass) {
    throw new Error('todo'); // TODO ASDASD
  }
  return new RuntimeDriverClass(deviceCookie, driverArgs);
}

module.exports = {
  createRuntimeDevice,
};
