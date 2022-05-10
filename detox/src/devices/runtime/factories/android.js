const _ = require('lodash');

// TODO (multiapps): Consider relocating the things below (belongs under runtime/)
const UiDeviceProxy = require('../../../android/espressoapi/UiDeviceProxy');
const Client = require('../../../client/Client');
const { InvocationManager } = require('../../../invoke');

const RuntimeDeviceFactory = require('./base');

/**
 * @typedef {{
 *    alias: String,
 *    client: Client,
 *    invocationManager: InvocationManager,
 *    uiDevice: UiDeviceProxy,
 *  }} TestApp
 */

class RuntimeDriverFactoryAndroid extends RuntimeDeviceFactory {
  _createDriverDependencies(commonDeps) {
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
   * @returns { Object.<String, TestApp> }
   * @internal
   */
  _createAppConnections({ appsConfig, sessionConfig }) {
    return _.mapValues(appsConfig, (appConfig, appAlias) => {
      const appSessionConfig = {
        ...sessionConfig,
        sessionId: `${sessionConfig.sessionId}:${appAlias}`,
      };

      const client = new Client(appSessionConfig);
      client.terminateApp = async () => {
        if (this.device && this.device._isAppRunning()) { // TODO use app alias here
          await this.device.terminateApp(); // TODO use app alias here
        }
      };
      const invocationManager = new InvocationManager(client);
      const uiDevice = new UiDeviceProxy(invocationManager).getUIDevice(); // TODO one instance of this should be enough

      return {
        alias: appAlias,
        client,
        invocationManager,
        uiDevice,
      };
    });
  }
}

class AndroidEmulator extends RuntimeDriverFactoryAndroid {
  _createDriver(deviceCookie, deps, configs) {
    const { deviceConfig } = configs;
    const props = {
      adbName: deviceCookie.adbName,
      avdName: deviceConfig.device.avdName,
      apps: this._createAppConnections(configs),
      forceAdbInstall: deviceConfig.forceAdbInstall,
    };

    const { AndroidEmulatorRuntimeDriver } = require('../drivers');
    return new AndroidEmulatorRuntimeDriver(deps, props);
  }
}

class AndroidAttached extends RuntimeDriverFactoryAndroid {
  _createDriver(deviceCookie, deps, configs) { // eslint-disable-line no-unused-vars
    const props = {
      adbName: deviceCookie.adbName,
      apps: this._createAppConnections(configs),
    };

    const { AttachedAndroidRuntimeDriver } = require('../drivers');
    return new AttachedAndroidRuntimeDriver(deps, props);
  }
}

class Genycloud extends RuntimeDriverFactoryAndroid {
  _createDriver(deviceCookie, deps, configs) { // eslint-disable-line no-unused-vars
    const props = {
      instance: deviceCookie.instance,
      apps: this._createAppConnections(configs),
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
