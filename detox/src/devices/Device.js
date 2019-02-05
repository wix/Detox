const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const log = require('../utils/logger').child({ __filename });
const argparse = require('../utils/argparse');
const debug = require('../utils/debug'); //debug utils, leave here even if unused

class Device {
  constructor({ deviceConfig, deviceDriver, sessionConfig }) {
    this._deviceConfig = deviceConfig;
    this._sessionConfig = sessionConfig;
    this._processes = {};
    this.deviceDriver = deviceDriver;
    this.deviceDriver.validateDeviceConfig(deviceConfig);
    this.debug = debug;
  }

  async prepare(params = {}) {
    this._binaryPath = this._getAbsolutePath(this._deviceConfig.binaryPath);
    this._testBinaryPath = this._deviceConfig.testBinaryPath ? this._getAbsolutePath(this._deviceConfig.testBinaryPath) : null;
    this._deviceId = await this.deviceDriver.acquireFreeDevice(this._deviceConfig.name);
    this._bundleId = await this.deviceDriver.getBundleIdFromBinary(this._binaryPath);

    await this.deviceDriver.prepare();

    if (!argparse.getArgValue('reuse')) {
      await this.deviceDriver.uninstallApp(this._deviceId, this._bundleId);
      await this.deviceDriver.installApp(this._deviceId, this._binaryPath, this._testBinaryPath);
    }

    if (params.launchApp) {
      await this.launchApp({newInstance: true});
    }
  }

  createPayloadFileAndUpdatesParamsObject(key, launchKey, params, baseLaunchArgs) {
    const payloadFilePath = this.deviceDriver.createPayloadFile(params[key]);
    baseLaunchArgs[launchKey] = payloadFilePath;
    //`params` will be used later for `deliverPayload`, so remove the actual notification and add the file URL
    delete params[key];
    params[launchKey] = payloadFilePath;
  }

  async launchApp(params = {newInstance: false}, bundleId) {
    const payloadParams = ['url', 'userNotification', 'userActivity'];
    const hasPayload = this._assertHasSingleParam(payloadParams, params);

    if (params.delete) {
      await this._terminateApp();
      await this._reinstallApp();
    } else if (params.newInstance) {
      await this._terminateApp();
    }

    let baseLaunchArgs = {
      ...params.launchArgs,
    };

    if (params.url) {
      baseLaunchArgs['detoxURLOverride'] = params.url;
      if (params.sourceApp) {
        baseLaunchArgs['detoxSourceAppOverride'] = params.sourceApp;
      }
    } else if (params.userNotification) {
      this.createPayloadFileAndUpdatesParamsObject('userNotification', 'detoxUserNotificationDataURL', params, baseLaunchArgs);
    } else if (params.userActivity) {
      this.createPayloadFileAndUpdatesParamsObject('userActivity', 'detoxUserActivityDataURL', params, baseLaunchArgs);
    }

    if (params.permissions) {
      await this.deviceDriver.setPermissions(this._deviceId, this._bundleId, params.permissions);
    }

    if (params.disableTouchIndicators) {
      baseLaunchArgs['detoxDisableTouchIndicators'] = true;
    }

    const _bundleId = bundleId || this._bundleId;
    if (this._isAppInBackground(params, _bundleId)) {
      if (hasPayload) {
        await this.deviceDriver.deliverPayload({...params, delayPayload: true});
      }
    }

    const processId = await this.deviceDriver.launchApp(this._deviceId, _bundleId, this._prepareLaunchArgs(baseLaunchArgs), params.languageAndLocale);
    this._processes[_bundleId] = processId;

    await this.deviceDriver.waitUntilReady();
    await this.deviceDriver.waitForActive();

    if(params.detoxUserNotificationDataURL) {
      await this.deviceDriver.cleanupRandomDirectory(params.detoxUserNotificationDataURL);
    }

    if(params.detoxUserActivityDataURL) {
      await this.deviceDriver.cleanupRandomDirectory(params.detoxUserActivityDataURL);
    }
  }

  _isAppInBackground(params, _bundleId) {
    return !params.delete && !params.newInstance && this._processes[_bundleId];
  }

  _assertHasSingleParam(singleParams, params) {
    let paramsCounter = 0;

    singleParams.forEach((item) => {
      if(params[item]) {
        paramsCounter += 1;
      }
    });
    if (paramsCounter > 1) {
      throw new Error(`Call to 'launchApp(${JSON.stringify(params)})' must contain only one of ${JSON.stringify(singleParams)}.`);
    }
    return (paramsCounter === 1);
  }

  /**deprecated */
  async relaunchApp(params = {}, bundleId) {
    if (params.newInstance === undefined) {
      params['newInstance'] = true;
    }
    await this.launchApp(params, bundleId);
  }

  async sendToHome() {
    await this.deviceDriver.sendToHome(this._deviceId);
    await this.deviceDriver.waitForBackground();
  }

  async shake() {
    await this.deviceDriver.shake(this._deviceId);
  }

  async terminateApp(bundleId) {
    const _bundleId = bundleId || this._bundleId;
    await this.deviceDriver.terminate(this._deviceId, _bundleId);
  }

  async installApp(binaryPath, testBinaryPath) {
    const _binaryPath = binaryPath || this._binaryPath;
    const _testBinaryPath = testBinaryPath || this._testBinaryPath;
    await this.deviceDriver.installApp(this._deviceId, _binaryPath, _testBinaryPath);
  }

  async uninstallApp(bundleId) {
    const _bundleId = bundleId || this._bundleId;
    await this.deviceDriver.uninstallApp(this._deviceId, _bundleId);
  }

  async reloadReactNative() {
    await this.deviceDriver.reloadReactNative();
  }

  async openURL(params) {
    if (typeof params !== 'object' || !params.url) {
      throw new Error(`openURL must be called with JSON params, and a value for 'url' key must be provided. example: await device.openURL({url: "url", sourceApp[optional]: "sourceAppBundleID"}`);
    }

    await this.deviceDriver.deliverPayload(params);
  }

  async shutdown() {
    await this.deviceDriver.shutdown(this._deviceId);
  }

  async setOrientation(orientation) {
    await this.deviceDriver.setOrientation(this._deviceId, orientation);
  }

  async setLocation(lat, lon) {
    lat = String(lat);
    lon = String(lon);
    await this.deviceDriver.setLocation(this._deviceId, lat, lon);
  }

  async _sendPayload(key, params) {
    const payloadFilePath = this.deviceDriver.createPayloadFile(params);
    let payload = {};
    payload[key] = payloadFilePath;
    await this.deviceDriver.deliverPayload(payload);
    this.deviceDriver.cleanupRandomDirectory(payloadFilePath);
  }

  async sendUserActivity(params) {
    await this._sendPayload('detoxUserActivityDataURL', params);
  }

  async sendUserNotification(params) {
    await this._sendPayload('detoxUserNotificationDataURL', params);
  }

  async setURLBlacklist(urlList) {
    await this.deviceDriver.setURLBlacklist(urlList);
  }

  async enableSynchronization() {
    await this.deviceDriver.enableSynchronization();
  }

  async disableSynchronization() {
    await this.deviceDriver.disableSynchronization();
  }

  async resetContentAndSettings() {
    await this.deviceDriver.resetContentAndSettings(this._deviceId);
  }

  getPlatform() {
    return this.deviceDriver.getPlatform(this._deviceId);
  }

  async _cleanup() {
    await this.deviceDriver.cleanup(this._deviceId, this._bundleId);
  }

  async pressBack() {
    await this.deviceDriver.pressBack(this._deviceId);
  }

  _defaultLaunchArgs() {
    return {
      'detoxServer': this._sessionConfig.server,
      'detoxSessionId': this._sessionConfig.sessionId
    };
  }

  _addPrefixToDefaultLaunchArgs(args) {
    let newArgs = {};
    _.forEach(args, (value, key) => {
      newArgs[`${this.deviceDriver.defaultLaunchArgsPrefix()}${key}`] = value;
    });
    return newArgs;
  }

  _prepareLaunchArgs(additionalLaunchArgs) {
    const merged = _.merge(this._defaultLaunchArgs(), additionalLaunchArgs);
    const launchArgs = this._addPrefixToDefaultLaunchArgs(merged);
    return launchArgs;
  }

  _getAbsolutePath(appPath) {
    if (path.isAbsolute(appPath)) {
      return appPath;
    }

    const absPath = path.join(process.cwd(), appPath);
    if (fs.existsSync(absPath)) {
      return absPath;
    } else {
      throw new Error(`app binary not found at '${absPath}', did you build it?`);
    }
  }

  async _terminateApp() {
    await this.deviceDriver.terminate(this._deviceId, this._bundleId);
    this._processes[this._bundleId] = undefined;
  }

  async _reinstallApp() {
    await this.deviceDriver.uninstallApp(this._deviceId, this._bundleId);
    await this.deviceDriver.installApp(this._deviceId, this._binaryPath, this._testBinaryPath);
  }
}

module.exports = Device;
