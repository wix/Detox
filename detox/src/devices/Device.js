const _ = require('lodash');
const debug = require('../utils/debug'); // debug utils, leave here even if unused
const { traceCall } = require('../utils/trace');
const log = require('../utils/logger').child({ __filename });

class Device {
  constructor({
    behaviorConfig,
    deviceConfig,
    deviceDriver,
    emitter,
    sessionConfig
  }) {
    this._behaviorConfig = behaviorConfig;
    this._deviceConfig = deviceConfig;
    this._sessionConfig = sessionConfig;
    this._emitter = emitter;
    this._processes = {};
    this.deviceDriver = deviceDriver;
    this.deviceDriver.validateDeviceConfig(deviceConfig);
    this.debug = debug;
  }

  async prepare() {
    await this.deviceDriver.prepare();

    this._deviceId = await traceCall('acquireDevice', () =>
      this.deviceDriver.acquireFreeDevice(this._deviceConfig.device || this._deviceConfig.name));
    this._bundleId = await this.deviceDriver.getBundleIdFromBinary(this._deviceConfig.binaryPath);
  }

  async launchApp(params = {}, bundleId = this._bundleId) {
    return traceCall('launchApp', () => this._doLaunchApp(params, bundleId));
  }

  async _doLaunchApp(params, bundleId) {
    const deviceId = this._deviceId;
    const payloadParams = ['url', 'userNotification', 'userActivity'];
    const hasPayload = this._assertHasSingleParam(payloadParams, params);
    const newInstance = params.newInstance !== undefined
      ? params.newInstance
      : this._processes[bundleId] == null;

    if (params.delete) {
      await this._terminateApp();
      await this._reinstallApp();
    } else if (newInstance) {
      await this._terminateApp();
    }

    const baseLaunchArgs = {
      ...this._deviceConfig.launchArgs,
      ...params.launchArgs,
    };

    if (params.url) {
      baseLaunchArgs['detoxURLOverride'] = params.url;
      if (params.sourceApp) {
        baseLaunchArgs['detoxSourceAppOverride'] = params.sourceApp;
      }
    } else if (params.userNotification) {
      this._createPayloadFileAndUpdatesParamsObject('userNotification', 'detoxUserNotificationDataURL', params, baseLaunchArgs);
    } else if (params.userActivity) {
      this._createPayloadFileAndUpdatesParamsObject('userActivity', 'detoxUserActivityDataURL', params, baseLaunchArgs);
    }

    if (params.permissions) {
      await this.deviceDriver.setPermissions(deviceId, bundleId, params.permissions);
    }

    if (params.disableTouchIndicators) {
      baseLaunchArgs['detoxDisableTouchIndicators'] = true;
    }

    if (this._isAppInBackground(params, bundleId)) {
      if (hasPayload) {
        await this.deviceDriver.deliverPayload({...params, delayPayload: true});
      }
    }

    let processId;
    if (this._behaviorConfig.launchApp === 'manual') {
      processId = await this.deviceDriver.waitForAppLaunch(deviceId, bundleId, this._prepareLaunchArgs(baseLaunchArgs), params.languageAndLocale);
    } else {
      processId = await this.deviceDriver.launchApp(deviceId, bundleId, this._prepareLaunchArgs(baseLaunchArgs), params.languageAndLocale);
      await this.deviceDriver.waitUntilReady();
      await this.deviceDriver.waitForActive();
    }
    this._processes[bundleId] = processId;

    await this._emitter.emit('appReady', {
      deviceId,
      bundleId,
      pid: processId,
    });

    if(params.detoxUserNotificationDataURL) {
      await this.deviceDriver.cleanupRandomDirectory(params.detoxUserNotificationDataURL);
    }

    if(params.detoxUserActivityDataURL) {
      await this.deviceDriver.cleanupRandomDirectory(params.detoxUserActivityDataURL);
    }
  }

  get id() {
    return this._deviceId;
  }

  get name() {
    return this.deviceDriver.name;
  }

  get type() {
    return this._deviceConfig.type;
  }

  async takeScreenshot(name) {
    if (!name) {
      throw new Error('Cannot take a screenshot with an empty name.');
    }

    return this.deviceDriver.takeScreenshot(this._deviceId, name);
  }

  async captureViewHierarchy(name = 'capture') {
    return this.deviceDriver.captureViewHierarchy(this._deviceId, name);
  }

  _createPayloadFileAndUpdatesParamsObject(key, launchKey, params, baseLaunchArgs) {
    const payloadFilePath = this.deviceDriver.createPayloadFile(params[key]);
    baseLaunchArgs[launchKey] = payloadFilePath;
    //`params` will be used later for `predeliverPayload`, so remove the actual notification and add the file URL
    delete params[key];
    params[launchKey] = payloadFilePath;
  }

  _isAppInBackground(params, bundleId) {
    return !params.delete && !params.newInstance && this._processes[bundleId];
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

  /**
   * @deprecated
   */
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

  async setBiometricEnrollment(toggle) {
    const yesOrNo = toggle ? 'YES' : 'NO';
    await this.deviceDriver.setBiometricEnrollment(this._deviceId, yesOrNo);
  }

  async matchFace() {
    await this.deviceDriver.matchFace(this._deviceId);
    await this.deviceDriver.waitForActive();
  }

  async unmatchFace() {
    await this.deviceDriver.unmatchFace(this._deviceId);
    await this.deviceDriver.waitForActive();
  }

  async matchFinger() {
    await this.deviceDriver.matchFinger(this._deviceId);
    await this.deviceDriver.waitForActive();
  }

  async unmatchFinger() {
    await this.deviceDriver.unmatchFinger(this._deviceId);
    await this.deviceDriver.waitForActive();
  }

  async shake() {
    await this.deviceDriver.shake(this._deviceId);
  }

  async terminateApp(bundleId) {
    const _bundleId = bundleId || this._bundleId;
    await this.deviceDriver.terminate(this._deviceId, _bundleId);
  }

  async installApp(binaryPath, testBinaryPath) {
    const _binaryPath = binaryPath || this._deviceConfig.binaryPath;
    const _testBinaryPath = testBinaryPath || this._deviceConfig.testBinaryPath;
    await traceCall('appInstall', () =>
      this.deviceDriver.installApp(this._deviceId, _binaryPath, _testBinaryPath));
  }

  async uninstallApp(bundleId) {
    const _bundleId = bundleId || this._bundleId;
    await traceCall('appUninstall', () =>
      this.deviceDriver.uninstallApp(this._deviceId, _bundleId));
  }

  async installUtilBinaries() {
    const paths = this._deviceConfig.utilBinaryPaths;
    if (paths) {
      await traceCall('installUtilBinaries', () =>
        this.deviceDriver.installUtilBinaries(this._deviceId, paths));
    }
  }

  async reloadReactNative() {
    await traceCall('reloadRN', () =>
      this.deviceDriver.reloadReactNative());
  }

  async openURL(params) {
    if (typeof params !== 'object' || !params.url) {
      throw new Error(`openURL must be called with JSON params, and a value for 'url' key must be provided. example: await device.openURL({url: "url", sourceApp[optional]: "sourceAppBundleID"}`);
    }

    await this.deviceDriver.deliverPayload(params, this._deviceId);
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

  async reverseTcpPort(port) {
    await this.deviceDriver.reverseTcpPort(this._deviceId, port);
  }

  async unreverseTcpPort(port) {
    await this.deviceDriver.unreverseTcpPort(this._deviceId, port);
  }

  async clearKeychain() {
    await this.deviceDriver.clearKeychain(this._deviceId);
  }

  async _sendPayload(key, params) {
    const payloadFilePath = this.deviceDriver.createPayloadFile(params);
    const payload = {
      [key]: payloadFilePath,
    };
    await this.deviceDriver.deliverPayload(payload, this._deviceId);
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

  getUiDevice() {
    return this.deviceDriver.getUiDevice();
  }

  async setStatusBar(params) {
    await this.deviceDriver.setStatusBar(this._deviceId, params);
  }

  async resetStatusBar() {
    await this.deviceDriver.resetStatusBar(this._deviceId);
  }

  _defaultLaunchArgs() {
    return {
      'detoxServer': this._sessionConfig.server,
      'detoxSessionId': this._sessionConfig.sessionId
    };
  }

  _prepareLaunchArgs(additionalLaunchArgs) {
    const launchArgs = _.merge(this._defaultLaunchArgs(), additionalLaunchArgs);
    return launchArgs;
  }

  async _terminateApp() {
    await this.deviceDriver.terminate(this._deviceId, this._bundleId);
    this._processes[this._bundleId] = undefined;
  }

  async _reinstallApp() {
    await this.deviceDriver.uninstallApp(this._deviceId, this._bundleId);
    await this.deviceDriver.installApp(this._deviceId, this._deviceConfig.binaryPath, this._deviceConfig.testBinaryPath);
  }
}

module.exports = Device;
