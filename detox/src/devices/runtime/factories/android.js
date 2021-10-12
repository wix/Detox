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
    const { AndroidEmulatorRuntimeDriver } = require('../drivers');

    const { adbName } = deviceCookie;
    return new AndroidEmulatorRuntimeDriver(adbName, deps, configs);
  }
}

class AndroidAttached extends RuntimeDriverFactoryAndroid {
  _createDriver(deviceCookie, deps, configs) { // eslint-disable-line no-unused-vars
    const { AttachedAndroidRuntimeDriver } = require('../drivers');

    const { adbName } = deviceCookie;
    return new AttachedAndroidRuntimeDriver(adbName, deps);
  }
}

class Genycloud extends RuntimeDriverFactoryAndroid {
  _createDriver(deviceCookie, deps, configs) { // eslint-disable-line no-unused-vars
    const { GenycloudRuntimeDriver } = require('../drivers');

    const { instance } = deviceCookie;
    return new GenycloudRuntimeDriver(instance, deps);
  }
}

module.exports = {
  AndroidEmulator,
  AndroidAttached,
  Genycloud,
};
