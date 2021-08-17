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
 * @param deviceArgs { Object } // TODO ASDASD Own the creation of invocation manager, etc?
 * @param driverArgs { Object }
 * @returns { RuntimeDevice }
 */
function createRuntimeDevice(deviceCookie, deviceArgs, driverArgs) {
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
