const RuntimeDevice = require('./RuntimeDevice');
const {
  AndroidEmulatorRuntimeDriver,
  AttachedAndroidRuntimeDriver,
  GenycloudRuntimeDriver,
  IosSimulatorRuntimeDriver,
} = require('./drivers');
const {
  AttachedAndroidDeviceCookie,
  AndroidEmulatorCookie,
  GenycloudEmulatorCookie,
  IosSimulatorCookie,
} = require('../cookies');

/**
 * @param deviceCookie { DeviceCookie }
 * @param commonDeps { Object }
 * @param configs { Object }
 * @returns { RuntimeDevice }
 */
function createRuntimeDevice(deviceCookie, commonDeps, configs) {
  const runtimeDriver = _createDriver(deviceCookie, commonDeps);
  return new RuntimeDevice({ ...commonDeps, ...configs }, runtimeDriver);
}

function _createDriver(deviceCookie, commonDeps) {
  let driver;
  if (deviceCookie.platform === 'android') {
    driver = _createAndroidDriver(deviceCookie, commonDeps);
  } else if (deviceCookie.platform === 'ios') {
    driver = _createIosDriver(deviceCookie, commonDeps);
  }

  if (!driver) {
    throw new Error('wuttt'); // TODO ASDASD
  }
  return driver;
}

function _createAndroidDriver(deviceCookie, commonDeps) {
  const serviceLocator = require('../../servicelocator/android');
  const adb = serviceLocator.adb();
  const aapt = serviceLocator.aapt();
  const fileXfer = serviceLocator.fileXfer();

  const AppInstallHelper = require('../common/drivers/android/tools/AppInstallHelper');
  const AppUninstallHelper = require('../common/drivers/android/tools/AppUninstallHelper');
  const MonitoredInstrumentation = require('../common/drivers/android/tools/MonitoredInstrumentation');
  const AndroidDevicePathBuilder = require('../../artifacts/utils/AndroidDevicePathBuilder');
  const deps = {
    ...commonDeps,
    adb,
    aapt,
    fileXfer,
    appInstallHelper: new AppInstallHelper(adb, fileXfer),
    appUninstallHelper: new AppUninstallHelper(adb),
    instrumentation: new MonitoredInstrumentation(adb),
    devicePathBuilder: new AndroidDevicePathBuilder(),
  }

  if (deviceCookie instanceof AndroidEmulatorCookie) {
    const { adbName, avdName } = deviceCookie;
    return new AndroidEmulatorRuntimeDriver(adbName, avdName, deps);
  }

  if (deviceCookie instanceof GenycloudEmulatorCookie) {
    const { instance } = deviceCookie;
    return new GenycloudRuntimeDriver(instance, deps);
  }

  if (deviceCookie instanceof AttachedAndroidDeviceCookie) {
    const { adbName } = deviceCookie;
    return new AttachedAndroidRuntimeDriver(adbName, deps);
  }
  return null;
}

function _createIosDriver(deviceCookie, commonDeps) {
  const serviceLocator = require('../../servicelocator/ios');
  const applesimutils = serviceLocator.appleSimUtils();

  if (deviceCookie instanceof IosSimulatorCookie) {
    const SimulatorLauncher = require('../allocation/drivers/ios/SimulatorLauncher');
    const deps = {
      ...commonDeps,
      applesimutils,
      simulatorLauncher: new SimulatorLauncher({ applesimutils, eventEmitter: commonDeps.emitter }),
    };

    const { udid, type } = deviceCookie;
    return new IosSimulatorRuntimeDriver(udid, type, deps);
  }
  return null;
}

module.exports = {
  createRuntimeDevice,
};
