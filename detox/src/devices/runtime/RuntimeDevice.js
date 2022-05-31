const _ = require('lodash');

const DetoxRuntimeError = require('../../errors/DetoxRuntimeError');
const debug = require('../../utils/debug'); // debug utils, leave here even if unused
const { traceCall } = require('../../utils/trace');
const wrapWithStackTraceCutter = require('../../utils/wrapWithStackTraceCutter');

const LaunchArgsEditor = require('./utils/LaunchArgsEditor');

class RuntimeDevice {
  constructor({
    appsConfig,
    behaviorConfig,
    deviceConfig,
    eventEmitter,
    sessionConfig,
    runtimeErrorComposer,
  }, deviceDriver) {
    wrapWithStackTraceCutter(this, [
      'captureViewHierarchy',
      'clearKeychain',
      'disableSynchronization',
      'enableSynchronization',
      'installApp',
      'launchApp',
      'matchFace',
      'matchFinger',
      'openURL',
      'pressBack',
      'relaunchApp',
      'reloadReactNative',
      'resetContentAndSettings',
      'resetStatusBar',
      'reverseTcpPort',
      'selectApp',
      'sendToHome',
      'sendUserActivity',
      'sendUserNotification',
      'setBiometricEnrollment',
      'setLocation',
      'setOrientation',
      'setStatusBar',
      'setURLBlacklist',
      'shake',
      'takeScreenshot',
      'terminateApp',
      'uninstallApp',
      'unmatchFace',
      'unmatchFinger',
      'unreverseTcpPort',
    ]);

    this._appsConfig = appsConfig;
    this._behaviorConfig = behaviorConfig;
    this._deviceConfig = deviceConfig;
    this._sessionConfig = sessionConfig;
    this._emitter = eventEmitter;
    this._errorComposer = runtimeErrorComposer;

    this._appLaunchArgs = new LaunchArgsEditor();

    this.deviceDriver = deviceDriver;
    this.deviceDriver.validateDeviceConfig(deviceConfig);
    this.debug = debug;
  }

  get id() {
    return this.deviceDriver.getExternalId();
  }

  get name() {
    return this.deviceDriver.getDeviceName();
  }

  get type() {
    return this._deviceConfig.type;
  }

  get appLaunchArgs() {
    return this._appLaunchArgs;
  }

  get _currentApp() {
    const alias = this.deviceDriver.selectedApp;
    return this._appsConfig[alias];
  }

  get _currentAppAlias() {
    return this.deviceDriver.selectedApp;
  }

  async _prepare() {
    await this.deviceDriver.prepare();
  }

  // TODO (multiapps) contract change
  async selectApp(aliasOrConfig) {
    if (aliasOrConfig === undefined) {
      throw this._errorComposer.cantSelectEmptyApp();
    }

    let alias;
    if (_.isObject(aliasOrConfig)) {
      const appConfig = aliasOrConfig;
      await this.deviceDriver.selectUnspecifiedApp(appConfig);
    } else {
      alias = aliasOrConfig;

      const appConfig = this._appsConfig[alias];
      if (!appConfig) {
        throw this._errorComposer.cantFindApp(alias);
      }
      await this.deviceDriver.selectApp(alias);
    }

    this._appLaunchArgs.reset();
    this._appLaunchArgs.modify(this._currentApp.launchArgs);
  }

  /** TODO (multiapps) Contract change: no appId; Only works on currently selected app */
  async launchApp(params = {}) {
    return traceCall('launchApp', () => this._doLaunchApp(params));
  }

  /**
   * @deprecated
   */
  async relaunchApp(params = {}) {
    if (params.newInstance === undefined) {
      params.newInstance = true;
    }
    await this.launchApp(params);
  }

  async takeScreenshot(name) {
    if (!name) {
      throw new DetoxRuntimeError('Cannot take a screenshot with an empty name.');
    }

    return this.deviceDriver.takeScreenshot(name);
  }

  async captureViewHierarchy(name = 'capture') {
    return this.deviceDriver.captureViewHierarchy(name);
  }

  async sendToHome() {
    await this.deviceDriver.sendToHome();
  }

  async setBiometricEnrollment(toggle) {
    const yesOrNo = toggle ? 'YES' : 'NO';
    await this.deviceDriver.setBiometricEnrollment(yesOrNo);
  }

  async matchFace() {
    await this.deviceDriver.matchFace();
  }

  async unmatchFace() {
    await this.deviceDriver.unmatchFace();
  }

  async matchFinger() {
    await this.deviceDriver.matchFinger();
  }

  async unmatchFinger() {
    await this.deviceDriver.unmatchFinger();
  }

  async shake() {
    await this.deviceDriver.shake();
  }

  // TODO (multiapps) contract change: no freestyle app ID accepted anymore
  async terminateApp() {
    await this.deviceDriver.terminateApp(this._currentAppAlias);
  }

  // TODO (multiapps) contract change: no freestyle installs with app/apk path(s)
  async installApp() {
    await traceCall('appInstall', () => this.deviceDriver.installApp(this._currentAppAlias));
  }

  // TODO (multiapps) contract change: no freestyle app ID accepted anymore
  async uninstallApp() {
    await traceCall('appUninstall', () => this.deviceDriver.uninstallApp(this._currentAppAlias));
  }

  async installUtilBinaries() {
    const paths = this._deviceConfig.utilBinaryPaths;
    if (paths) {
      await traceCall('installUtilBinaries', () =>
        this.deviceDriver.installUtilBinaries(paths));
    }
  }

  async reloadReactNative() {
    await traceCall('reloadRN', () =>
      this.deviceDriver.reloadReactNative());
  }

  async openURL(params) {
    if (typeof params !== 'object' || !params.url) {
      throw new DetoxRuntimeError(`openURL must be called with JSON params, and a value for 'url' key must be provided. example: await device.openURL({url: "url", sourceApp[optional]: "sourceAppBundleID"}`);
    }

    await this.deviceDriver.deliverPayload(params);
  }

  async setOrientation(orientation) {
    await this.deviceDriver.setOrientation(orientation);
  }

  async setLocation(lat, lon) {
    lat = String(lat);
    lon = String(lon);
    await this.deviceDriver.setLocation(lat, lon);
  }

  async reverseTcpPort(port) {
    await this.deviceDriver.reverseTcpPort(port);
  }

  async unreverseTcpPort(port) {
    await this.deviceDriver.unreverseTcpPort(port);
  }

  async clearKeychain() {
    await this.deviceDriver.clearKeychain();
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
    await this.deviceDriver.resetContentAndSettings();
  }

  getPlatform() {
    return this.deviceDriver.getPlatform();
  }

  async pressBack() {
    await this.deviceDriver.pressBack();
  }

  getUiDevice() {
    return this.deviceDriver.getUiDevice();
  }

  async setStatusBar(params) {
    await this.deviceDriver.setStatusBar(params);
  }

  async resetStatusBar() {
    await this.deviceDriver.resetStatusBar();
  }

  async _cleanup() {
    await this.deviceDriver.cleanup();
  }

  _getCurrentApp() {
    if (!this._currentApp) {
      throw this._errorComposer.appNotSelected();
    }
    return this._currentApp;
  }

  async _doLaunchApp(launchParams) {
    const payloadParams = ['url', 'userNotification', 'userActivity'];
    const hasPayload = this._assertHasSingleParam(payloadParams, launchParams);
    const appAlias = this.deviceDriver.selectedApp;
    const isRunning = this.deviceDriver.isAppRunning(appAlias);
    const newInstance = (launchParams.newInstance !== undefined)
      ? launchParams.newInstance
      : !isRunning;

    if (launchParams.delete) {
      await this.deviceDriver.terminateApp(appAlias);
      await this.deviceDriver.uninstallApp(appAlias);
      await this.deviceDriver.installApp(appAlias);
    } else if (newInstance) {
      await this.deviceDriver.terminateApp(appAlias);
    }

    if (launchParams.permissions) {
      await this.deviceDriver.setPermissions(launchParams.permissions, appAlias);
    }

    const launchArgs = this._prepareLaunchArgs(launchParams);

    if (isRunning && hasPayload) {
      await this.deviceDriver.deliverPayload({ ...launchParams, delayPayload: true });
    }

    if (this._behaviorConfig.launchApp === 'manual') {
      await this.deviceDriver.waitForAppLaunch(launchArgs, launchParams.languageAndLocale, appAlias);
    } else {
      await this.deviceDriver.launchApp(launchArgs, launchParams.languageAndLocale, appAlias);
    }

    if (launchParams.detoxUserNotificationDataURL) {
      await this.deviceDriver.cleanupRandomDirectory(launchParams.detoxUserNotificationDataURL);
    }

    if(launchParams.detoxUserActivityDataURL) {
      await this.deviceDriver.cleanupRandomDirectory(launchParams.detoxUserActivityDataURL);
    }
  }

  async _sendPayload(key, params) {
    const payloadFilePath = this.deviceDriver.createPayloadFile(params);
    const payload = {
      [key]: payloadFilePath,
    };
    await this.deviceDriver.deliverPayload(payload);
    this.deviceDriver.cleanupRandomDirectory(payloadFilePath);
  }

  _assertHasSingleParam(singleParams, params) {
    let paramsCounter = 0;

    singleParams.forEach((item) => {
      if(params[item]) {
        paramsCounter += 1;
      }
    });

    if (paramsCounter > 1) {
      throw new DetoxRuntimeError(`Call to 'launchApp(${JSON.stringify(params)})' must contain only one of ${JSON.stringify(singleParams)}.`);
    }

    return (paramsCounter === 1);
  }

  _prepareLaunchArgs(launchParams) {
    const launchArgs = {
      ...this._appLaunchArgs.get(),
      ...launchParams.launchArgs,
    };

    if (launchParams.url) {
      launchArgs['detoxURLOverride'] = launchParams.url;
      if (launchParams.sourceApp) {
        launchArgs['detoxSourceAppOverride'] = launchParams.sourceApp;
      }
    } else if (launchParams.userNotification) {
      this._createPayloadFileAndUpdatesParamsObject('userNotification', 'detoxUserNotificationDataURL', launchParams, launchArgs);
    } else if (launchParams.userActivity) {
      this._createPayloadFileAndUpdatesParamsObject('userActivity', 'detoxUserActivityDataURL', launchParams, launchArgs);
    }

    if (launchParams.disableTouchIndicators) {
      launchArgs['detoxDisableTouchIndicators'] = true;
    }
    return launchArgs;
  }

  _createPayloadFileAndUpdatesParamsObject(key, launchKey, params, baseLaunchArgs) {
    const payloadFilePath = this.deviceDriver.createPayloadFile(params[key]);
    baseLaunchArgs[launchKey] = payloadFilePath;
    //`params` will be used later for `predeliverPayload`, so remove the actual notification and add the file URL
    delete params[key];
    params[launchKey] = payloadFilePath;
  }

  async _onTestEnd(testSummary) {
    await this.deviceDriver.onTestEnd(testSummary);
  }
}

module.exports = RuntimeDevice;
