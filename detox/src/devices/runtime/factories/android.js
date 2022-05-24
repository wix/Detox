const _ = require('lodash');

// TODO (multiapps): Consider relocating the things below (belongs under runtime/)
const UiDeviceProxy = require('../../../android/espressoapi/UiDeviceProxy');
const Client = require('../../../client/Client');
const { InvocationManager } = require('../../../invoke');

const RuntimeDeviceFactory = require('./base');

class RuntimeDriverFactoryAndroid extends RuntimeDeviceFactory {
  _createDriverDependencies(commonDeps, configs) {
    const apps = this._createAppDeps(configs);
    const serviceLocator = require('../../../servicelocator/android');
    const adb = serviceLocator.adb;
    const aapt = serviceLocator.aapt;
    const apkValidator = serviceLocator.apkValidator;
    const fileXfer = serviceLocator.fileXfer;
    const devicePathBuilder = serviceLocator.devicePathBuilder;

    const AppInstallHelper = require('../../common/drivers/android/tools/AppInstallHelper');
    const AppUninstallHelper = require('../../common/drivers/android/tools/AppUninstallHelper');
    const MonitoredInstrumentation = require('../../common/drivers/android/tools/MonitoredInstrumentation');

    return {
      ...commonDeps,
      apps,
      adb,
      aapt,
      apkValidator,
      fileXfer,
      devicePathBuilder,
      appInstallHelper: new AppInstallHelper(adb, fileXfer),
      appUninstallHelper: new AppUninstallHelper(adb),
      instrumentation: new MonitoredInstrumentation(adb),
    };
  }

  /**
   * @returns { Object.<String, AndroidApp> }
   * @internal
   */
  _createAppDeps({ appsConfig, sessionConfig }) {
    const { sessionId } = sessionConfig;

    return _.mapValues(appsConfig, (appConfig, alias) => {
      const appSessionConfig = {
        ...sessionConfig,
        sessionId: `${sessionId}:${alias}`,
      };

      const client = new Client(appSessionConfig);
      const invocationManager = new InvocationManager(client);
      const uiDevice = new UiDeviceProxy(invocationManager).getUIDevice();

      return {
        alias,
        client,
        invocationManager,
        uiDevice,
      };
    });
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
  _createDriver(deviceCookie, deps) {
    const props = {
      adbName: deviceCookie.adbName,
    };

    const { AttachedAndroidRuntimeDriver } = require('../drivers');
    return new AttachedAndroidRuntimeDriver(deps, props);
  }
}

class Genycloud extends RuntimeDriverFactoryAndroid {
  _createDriver(deviceCookie, deps) {
    const props = {
      instance: deviceCookie.instance,
    };

    const { GenycloudRuntimeDriver } = require('../drivers');
    return new GenycloudRuntimeDriver(deps, props);
  }
}

module.exports = {
  AndroidEmulator,
  AndroidAttached,
  Genycloud,
};
