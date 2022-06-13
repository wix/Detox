const _ = require('lodash');

const RuntimeDevice = require('../RuntimeDevice');
const { PredefinedTestApp, UnspecifiedTestApp, UtilApp } = require('../TestApp');

class RuntimeDeviceFactory {
  createRuntimeDevice(deviceCookie, commonDeps, configs) {
    const apps = this._createApps(deviceCookie, commonDeps, configs);

    const driver = this._createDeviceDriver(deviceCookie, commonDeps, configs);

    const { deviceConfig } = configs;
    return new RuntimeDevice(apps, { ...commonDeps, driver }, { deviceConfig });
  }

  _createApps(deviceCookie, commonDeps, configs) {
    return {
      predefinedApps: this._createPredefinedTestApps(deviceCookie, commonDeps, configs),
      unspecifiedApp: this._createUnspecifiedTestApp(deviceCookie, commonDeps, configs),
      utilApps: this._createUtilAppsList(deviceCookie, commonDeps, configs),
    };
  }

  _createPredefinedTestApps(deviceCookie, commonDeps, configs) {
    const { appsConfig, behaviorConfig } = configs;
    return _.mapValues(appsConfig, (appConfig, alias) => {
      const driver = this._createTestAppDriver(deviceCookie, commonDeps, configs, alias);
      return new PredefinedTestApp(driver, { appConfig, behaviorConfig }, alias);
    });
  }

  _createUnspecifiedTestApp(deviceCookie, commonDeps, configs) {
    const { behaviorConfig } = configs;
    const driver = this._createTestAppDriver(deviceCookie, commonDeps, configs, null);
    return new UnspecifiedTestApp(driver, { behaviorConfig });
  }

  _createUtilAppsList(deviceCookie, commonDeps, configs) {
    const { deviceConfig } = configs;

    return deviceConfig.utilBinaryPaths.map((binaryPath) => {
      const driver = this._createTestAppDriver(deviceCookie, commonDeps, configs, null);
      const appConfig = { binaryPath };
      return new UtilApp(driver, { appConfig });
    });
  }

  _createTestAppDriver(_deviceCookie, _commonDeps, _configs, _alias) {}
  _createDeviceDriver(_deviceCookie, _deps, _configs) {}
}

module.exports = RuntimeDeviceFactory;
