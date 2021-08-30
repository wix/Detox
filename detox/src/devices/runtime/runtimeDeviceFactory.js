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
 * @param commonDeps { Object } // TODO ASDASD Own the creation of invocation manager, etc?
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
  const ADB = require('../common/drivers/android/exec/ADB');
  const AAPT = require('../common/drivers/android/exec/AAPT');
  const TempFileXfer = require('../common/drivers/android/tools/TempFileXfer');
  const AppInstallHelper = require('../common/drivers/android/tools/AppInstallHelper');
  const AppUninstallHelper = require('../common/drivers/android/tools/AppUninstallHelper');
  const MonitoredInstrumentation = require('../common/drivers/android/tools/MonitoredInstrumentation');
  const AndroidDevicePathBuilder = require('../../artifacts/utils/AndroidDevicePathBuilder');

  const adb = new ADB();
  const fileXfer = new TempFileXfer(adb);
  const deps = {
    ...commonDeps,
    adb,
    fileXfer,
    aapt: new AAPT(),
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
    return new GenycloudRuntimeDriver(deviceCookie.instance, deps);
  }

  if (deviceCookie instanceof AttachedAndroidDeviceCookie) {
    return new AttachedAndroidRuntimeDriver(deviceCookie.adbName, deps);
  }
  return null;
}

function _createIosDriver(deviceCookie, commonDeps) {
  if (deviceCookie instanceof IosSimulatorCookie) {
    const AppleSimUtils = require('../common/drivers/ios/tools/AppleSimUtils');
    const SimulatorLauncher = require('../allocation/drivers/ios/SimulatorLauncher');

    const applesimutils = new AppleSimUtils();
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
