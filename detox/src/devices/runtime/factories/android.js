const RuntimeDeviceFactory = require('./base');

class RuntimeDriverFactoryAndroid extends RuntimeDeviceFactory {
  _createDriverDependencies(commonDeps) {
    const serviceLocator = require('../../../servicelocator/android');
    const adb = serviceLocator.adb;
    const aapt = serviceLocator.aapt;
    const fileXfer = serviceLocator.fileXfer;
    const devicePathBuilder = serviceLocator.devicePathBuilder;

    const AppInstallHelper = require('../../common/drivers/android/tools/AppInstallHelper');
    const AppUninstallHelper = require('../../common/drivers/android/tools/AppUninstallHelper');
    const MonitoredInstrumentation = require('../../common/drivers/android/tools/MonitoredInstrumentation');

    return {
      ...commonDeps,
      adb,
      aapt,
      fileXfer,
      devicePathBuilder,
      appInstallHelper: new AppInstallHelper(adb, fileXfer),
      appUninstallHelper: new AppUninstallHelper(adb),
      instrumentation: new MonitoredInstrumentation(adb),
    };
  }
}

class AndroidEmulator extends RuntimeDriverFactoryAndroid {
  _createDriver(deviceCookie, deps, configs) {
    const { adbName } = deviceCookie;

    const { AndroidEmulatorRuntimeDriver } = require('../drivers');
    return new AndroidEmulatorRuntimeDriver(deps, configs, adbName);
  }
}

class AndroidAttached extends RuntimeDriverFactoryAndroid {
  _createDriver(deviceCookie, deps, configs) { // eslint-disable-line no-unused-vars
    const { adbName } = deviceCookie;

    const { AttachedAndroidRuntimeDriver } = require('../drivers');
    return new AttachedAndroidRuntimeDriver(deps, adbName);
  }
}

class Genycloud extends RuntimeDriverFactoryAndroid {
  _createDriver(deviceCookie, deps, configs) { // eslint-disable-line no-unused-vars
    const { instance } = deviceCookie;

    const { GenycloudRuntimeDriver } = require('../drivers');
    return new GenycloudRuntimeDriver(deps, instance);
  }
}

module.exports = {
  AndroidEmulator,
  AndroidAttached,
  Genycloud,
};
