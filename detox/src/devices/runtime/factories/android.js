const RuntimeDeviceFactory = require('./base');

class RuntimeDriverFactoryAndroid extends RuntimeDeviceFactory {
  _createFundamentalDriverDeps(commonDeps) {
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

  _createAppDriverDeps(fundamentalDeps, { sessionConfig }, alias) {
    const UiDeviceProxy = require('../../../android/espressoapi/UiDeviceProxy');
    const Client = require('../../../client/Client');
    const { InvocationManager } = require('../../../invoke');
    const MonitoredInstrumentation = require('../../common/drivers/android/tools/MonitoredInstrumentation');

    const { adb } = fundamentalDeps;
    const appSessionConfig = this._createAppSessionConfig(sessionConfig, alias);
    const client = new Client(appSessionConfig); // TODO (multiapps): Share the same ws
    const invocationManager = new InvocationManager(client);
    const uiDevice = new UiDeviceProxy(invocationManager).getUIDevice();
    const instrumentation = new MonitoredInstrumentation(adb);

    return {
      client,
      invocationManager,
      uiDevice,
      instrumentation,
    };
  }

  _createAppSessionConfig(sessionConfig, alias) {
    const { sessionId } = sessionConfig;

    if (alias) {
      return {
        ...sessionConfig,
        sessionId: `${sessionId}:${alias}`,
      };
    }
    return sessionConfig;
  }
}

class AndroidEmulator extends RuntimeDriverFactoryAndroid {
  /** @override */
  _createTestAppDriver(deviceCookie, commonDeps, { deviceConfig, sessionConfig }, alias) {
    const fundamentalDeps = this._createFundamentalDriverDeps(commonDeps);
    const appDeps = this._createAppDriverDeps(fundamentalDeps, { sessionConfig }, alias);

    const deps = {
      ...fundamentalDeps,
      ...appDeps,
    };

    const props = {
      adbName: deviceCookie.adbName,
      forceAdbInstall: deviceConfig.forceAdbInstall,
    };

    const { EmulatorAppDriver } = require('../drivers/android/emulator/EmulatorDriver');
    return new EmulatorAppDriver(deps, props);
  }

  /** @override */
  _createDeviceDriver(deviceCookie, commonDeps, { deviceConfig }) {
    const fundamentalDeps = this._createFundamentalDriverDeps(commonDeps);

    const props = {
      adbName: deviceCookie.adbName,
      avdName: deviceConfig.device.avdName,
    };

    const { EmulatorDeviceDriver } = require('../drivers/android/emulator/EmulatorDriver');
    return new EmulatorDeviceDriver(fundamentalDeps, props);
  }
}

class AndroidAttached extends RuntimeDriverFactoryAndroid {
  _createDriver(deviceCookie, deps, configs) { // eslint-disable-line no-unused-vars
    const props = {
      adbName: deviceCookie.adbName,
    };

    const { AttachedAndroidRuntimeDriver } = require('../drivers');
    return new AttachedAndroidRuntimeDriver(deps, props);
  }
}

class Genycloud extends RuntimeDriverFactoryAndroid {
  _createDriver(deviceCookie, deps, configs) { // eslint-disable-line no-unused-vars
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
