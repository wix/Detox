// @ts-nocheck
const os = require('os');
const path = require('path');

const fs = require('fs-extra');
const _ = require('lodash');

const log = require('../../../utils/logger').child({ __filename });

/**
 * @typedef TestApp
 * @property alias { String }
 * @property client { Client }
 */

/**
 * @typedef DeviceDriverDeps
 * @property apps { Object.<String, TestApp> }
 * @property client { Client } The *general purpose* (non-app-bound) client
 * @property invocationManager { InvocationManager } The *general purpose* (non-app-bound) invocation manager
 * @property eventEmitter { AsyncEmitter }
 */

const _unspecifiedAppAlias = Symbol('unspecified-app');

class RuntimeDriverBase {
  /**
   * @param deps { DeviceDriverDeps }
   */
  constructor({ client, invocationManager, apps, eventEmitter }) {
    this.emitter = eventEmitter;

    this._apps = _.clone(apps);
    this._apps[_unspecifiedAppAlias] = {
      alias: null,
      client,
      invocationManager,
    };
    this._selectedApp = this._apps[_unspecifiedAppAlias];
    this._processes = {}; // Note: Can't integrate this into _apps because we allow launching of apps out of the apps list

    _.forEach(apps, (app, alias) =>
      app.client.terminateApp = () => this.terminateApp(alias));
  }

  /**
   * @returns { String | undefined }
   */
  getExternalId() {
    return undefined;
  }

  /**
   * @returns { String | undefined }
   */
  getDeviceName() {
    return undefined;
  }

  /**
   * @returns { String | null } App alias.
   */
  get selectedApp() {
    return this._selectedApp.alias;
  }

  get _unspecifiedApp() {
    return this._apps[_unspecifiedAppAlias];
  }

  async selectApp(appAlias) {
    this._selectedApp = this._apps[appAlias];

    if (!this._selectedApp.appId) {
      this._selectedApp.appId = await this._inferAppId(this._selectedApp);
    }
  }

  async _selectUnspecifiedApp() {
    this._selectedApp = this._unspecifiedApp;
  }

  async clearSelectedApp() {
    this._selectedApp = this._apps[_unspecifiedAppAlias];
  }

  get invocationManager() {
    return this._selectedApp.invocationManager;
  }

  get client() {
    return this._selectedApp.client;
  }

  isAppRunning(appId) {
    return (this._processes[appId] !== undefined);
  }

  /**
   * @param testSummary {{ testName: String, pendingRequests: Boolean }}
   * @returns { Promise<void> }
   */
  async onTestEnd({ testName, pendingRequests }) {
    if (pendingRequests) {
      this._allAppsList().forEach(({ client }) => client.dumpPendingRequests({ testName }));
    }
  }

  async installApp(_binaryPath, _testBinaryPath) {}
  async uninstallApp() {}
  installUtilBinaries() {}

  async launchApp(launchArgs, languageAndLocale, appId) {
    if (appId) {
      await this._selectUnspecifiedApp();
      this._selectedApp.appId = appId;
    }
    const app = this._selectedApp;
    const _appId = app.appId;
    const _launchArgs = this._applyAppSessionArgs(app, launchArgs);

    this._processes[_appId] = await this._launchApp(_launchArgs, languageAndLocale, app);

    await this._waitUntilReady(app);
    await this.waitForActive();
    await this._notifyAppReady(_appId);
  }

  // TODO (multiapps) unit-test this
  async waitForAppLaunch(launchArgs, languageAndLocale, appId) {
    const app = this._getAppById(appId);
    const _appId = app.appId;
    const _launchArgs = this._applyAppSessionArgs(app, launchArgs);

    this._processes[_appId] = await this._waitForAppLaunch(_launchArgs, languageAndLocale, app);
  }

  async terminateApp(appAlias) {
    const appId = this._apps[appAlias].appId;
    return this.terminate(appId);
  }

  async terminate() {
    const app = this._selectedApp;
    const appId = app.appId;
    await this._terminate(app);
    this._processes[appId] = undefined;
  }

  /**
   * @param app { TestApp }
   * @protected
   */
  async _terminate(app) {}

  /**
   * @protected
   */
  async _waitUntilReady() {
    return this.client.waitUntilReady();
  }

  async waitForActive() {}
  async waitForBackground() {}

  async reloadReactNative() {
    return await this.client.reloadReactNative();
  }

  async deliverPayload(params) {
    return await this.client.deliverPayload(params);
  }

  async takeScreenshot(_screenshotName) {}
  async sendToHome() {}
  async setBiometricEnrollment() {}
  async matchFace() {}
  async unmatchFace() {}
  async matchFinger() {}
  async unmatchFinger() {}
  async shake() {}
  async setLocation(_lat, _lon) {}

  async reverseTcpPort() {}
  async unreverseTcpPort() {}

  async clearKeychain(_udid) {}

  createPayloadFile(notification) {
    const notificationFilePath = path.join(this.createRandomDirectory(), `payload.json`);
    fs.writeFileSync(notificationFilePath, JSON.stringify(notification, null, 2));
    return notificationFilePath;
  }

  async setPermissions(_appId, _permissions) {}

  async setOrientation(_orientation) {}
  async setURLBlacklist(_urlList) {}

  async enableSynchronization() {}
  async disableSynchronization() {}
  async resetContentAndSettings(_deviceId, _deviceConfig) {}

  createRandomDirectory() {
    const randomDir = fs.mkdtempSync(path.join(os.tmpdir(), 'detoxrand-'));
    fs.ensureDirSync(randomDir);
    return randomDir;
  }

  cleanupRandomDirectory(fileOrDir) {
    if(path.basename(fileOrDir).startsWith('detoxrand-')) {
      fs.removeSync(fileOrDir);
    }
  }

  validateDeviceConfig(_deviceConfig) {
  }

  getPlatform() {
    return '';
  }

  getUiDevice() {
    log.warn(`getUiDevice() is an Android-specific function, it exposes UiAutomator's UiDevice API (https://developer.android.com/reference/android/support/test/uiautomator/UiDevice).`);
    log.warn(`Make sure you create an Android-specific test for this scenario.`);

    return undefined;
  }

  async cleanup() { // TODO (multiapps) Any use case where this should get a specific appId?
    this.emitter.off();
    await this._cleanupApps();
  }

  getLogsPaths() {
    return {
      stdout: undefined,
      stderr: undefined
    };
  }

  async pressBack() {
    log.warn('pressBack() is an Android-specific function.');
    log.warn(`Make sure you create an Android-specific test for this scenario.`);
  }

  async typeText(_text) {}

  async setStatusBar(_flags) {}
  async resetStatusBar() {}

  async captureViewHierarchy() {
    return '';
  }

  /**
   * @protected
   */
  _launchApp(_launchArgs, _languageAndLocale, _app) {}

  /**
   * @protected
   */
  _waitForAppLaunch() {}

  async _notifyAppReady(appId) {
    await this.emitter.emit('appReady', {
      deviceId: this.getExternalId(),
      bundleId: appId,
      pid: this._processes[appId],
    });
  }

  async _cleanupApps() {
    const promises = _.map(this._allAppsList(), ({ client }) => {
      client.dumpPendingRequests();
      return client.cleanup();
    });
    return Promise.all(promises);
  }

  _applyAppSessionArgs(app, launchArgs) {
    return {
      detoxServer: app.client.serverUrl,
      detoxSessionId: app.client.sessionId,
      ...launchArgs,
    };
  }

  _allAppsList() {
    return Reflect.ownKeys(this._apps).map((alias) => this._apps[alias]);
  }

  _getAppById(appId) {
    let app = this._selectedApp;
    if (appId) {
      app = this._unspecifiedApp;
      app.appId = appId;
    }
    return app;
  }

  /**
   * @param app
   * @returns {Promise<string>}
   * @protected
   */
  async _inferAppId(app) { // eslint-disable-line no-unused-vars
    return '';
  }
}

module.exports = RuntimeDriverBase;
