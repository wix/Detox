/* eslint @typescript-eslint/no-unused-vars: ["error", { "args": "none" }] */
const RuntimeDeviceFactory = require('./base');

class RuntimeDriverFactoryAndroid extends RuntimeDeviceFactory {
  _createDriverDependencies(commonDeps) {
    const serviceLocator = require('../../servicelocator/android');
    const adb = serviceLocator.adb;
    const aapt = serviceLocator.aapt;
    const apkValidator = serviceLocator.apkValidator;
    const fileTransfer = serviceLocator.fileTransfer;
    const devicePathBuilder = serviceLocator.devicePathBuilder;

    const AppInstallHelper = require('../../common/drivers/android/tools/AppInstallHelper');
    const AppUninstallHelper = require('../../common/drivers/android/tools/AppUninstallHelper');
    const MonitoredInstrumentation = require('../../common/drivers/android/tools/MonitoredInstrumentation');

    return {
      ...commonDeps,
      adb,
      aapt,
      apkValidator,
      fileTransfer,
      devicePathBuilder,
      appInstallHelper: new AppInstallHelper(adb, fileTransfer),
      appUninstallHelper: new AppUninstallHelper(adb),
      instrumentation: new MonitoredInstrumentation(adb),
    };
  }
}

class AndroidEmulator extends RuntimeDriverFactoryAndroid {
  _createDriver(deviceCookie, deps, { deviceConfig }) {
    const props = {
      adbName: deviceCookie.adbName,
      avdName: deviceConfig.device.avdName,
      forceAdbInstall: deviceConfig.forceAdbInstall,
    };

    const { AndroidEmulatorRuntimeDriver } = require('../drivers');
    return new AndroidEmulatorRuntimeDriver(deps, props);
  }
}

class AndroidAttached extends RuntimeDriverFactoryAndroid {
  _createDriver(deviceCookie, deps, configs) {
    const { AttachedAndroidRuntimeDriver } = require('../drivers');
    return new AttachedAndroidRuntimeDriver(deps, deviceCookie);
  }
}

class Genycloud extends RuntimeDriverFactoryAndroid {
  _createDriver(deviceCookie, deps, configs) {
    const { GenycloudRuntimeDriver } = require('../drivers');
    return new GenycloudRuntimeDriver(deps, deviceCookie);
  }
}

module.exports = {
  AndroidEmulator,
  AndroidAttached,
  Genycloud,
};
