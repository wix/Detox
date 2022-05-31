// @ts-nocheck
const os = require('os');
const path = require('path');

const fs = require('fs-extra');
const _ = require('lodash');

const log = require('../../../utils/logger').child({ __filename });
const { forEachSeries } = require('../../../utils/p-iteration');

/**
 * @typedef TestApp
 * @property alias { String }
 * @property config { Object }
 * @property client { Client }
 * @property invocationManager { InvocationManager }
 */

/**
 * @typedef DeviceDriverDeps
 * @property apps { Object.<String, TestApp> }
 * @property client { Client } The *general purpose* (non-app-bound) client
 * @property invocationManager { InvocationManager } The *general purpose* (non-app-bound) invocation manager
 * @property eventEmitter { AsyncEmitter }
 * @property errorComposer { DetoxRuntimeErrorComposer }
 */

const _unspecifiedAppAlias = Symbol('unspecified-app');

class RuntimeDriverBase {
  /**
   * @param deps { DeviceDriverDeps }
   */
  constructor({ client, invocationManager, apps = {}, eventEmitter, errorComposer }) {
    this.emitter = eventEmitter;
    this.errorComposer = errorComposer;

    this._apps = _.clone(apps);
    this._apps[_unspecifiedAppAlias] = {
      alias: null,
      client,
      invocationManager,
    };
    this._selectedApp = this._apps[_unspecifiedAppAlias];

    this._allAppsList().forEach((app) =>
      app.client.terminateApp = () => this.terminateApp(app.alias));
  }

  async prepare() {
    const promises = this._allAppsList().map(({ client }) => client.connect());
    await Promise.all(promises);
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

  /** @protected */
  get _unspecifiedApp() {
    return this._apps[_unspecifiedAppAlias];
  }

  async selectApp(appAlias) {
    this._selectedApp = this._apps[appAlias];

    if (!this._selectedApp.appId) {
      this._selectedApp.appId = await this._inferAppId(this._selectedApp);
    }
  }

  /**
   * @param appConfig {{ appId: String, binaryPath: String }}
   */
  async selectUnspecifiedApp(appConfig) {
    const app = {
      ...this._apps[_unspecifiedAppAlias],
      config: appConfig,
    };
    app.appId = await this._inferAppId(app);

    const currentAppId = this._unspecifiedApp.appId;
    if (currentAppId && currentAppId !== app.appId && this.isAppRunning(undefined)) {
      throw this.errorComposer.differentAppAlreadyRunning();
    }
    this._apps[_unspecifiedAppAlias] = app;
  }

  get invocationManager() {
    return this._selectedApp.invocationManager;
  }

  get client() {
    return this._selectedApp.client;
  }

  isAppRunning(appAlias) {
    const app = this._getAppByAlias(appAlias);
    return !!app.pid;
  }

  /**
   * @param appAlias { String | undefined }
   */
  async launchApp(launchArgs, languageAndLocale, appAlias) {
    const app = this._getAppByAlias(appAlias);
    this._validateLaunchApp(app);

    const _launchArgs = this._applyAppSessionArgs(app, launchArgs);
    app.pid = await this._launchApp(app, _launchArgs, languageAndLocale);

    await this._waitUntilReady(app);
    await this._notifyAppReady(app);
  }

  // TODO (multiapps) unit-test this
  async waitForAppLaunch(launchArgs, languageAndLocale, appAlias) {
    const app = this._getAppByAlias(appAlias);
    const _launchArgs = this._applyAppSessionArgs(app, launchArgs);

    app.pid = await this._waitForAppLaunch(_launchArgs, languageAndLocale, app);
  }

  /**
   * @param appAlias { String | undefined }
   */
  async terminateApp(appAlias) {
    const app = this._getAppByAlias(appAlias);
    await this._terminate(app);

    app.pid = undefined;
  }

  /** @protected */
  async _terminate(_app) {}

  /**
   * @param testSummary {{ testName: String, pendingRequests: Boolean }}
   * @returns { Promise<void> }
   */
  async onTestEnd({ testName, pendingRequests }) {
    if (pendingRequests) {
      this._allAppsList().forEach(({ client }) => client.dumpPendingRequests({ testName }));
    }
  }

  /**
   * @protected
   */
  async _waitUntilReady() {
    return this.client.waitUntilReady();
  }

  /**
   * @param appAlias { String | undefined }
   */
  async installApp(appAlias) {
    const app = this._getAppByAlias(appAlias);
    return this._installApp(app);
  }

  /** @protected */
  async _installApp(_app) {}

  /**
   * @param appAlias { String | undefined }
   */
  async uninstallApp(appAlias) {
    const app = this._getAppByAlias(appAlias);
    return this._uninstallApp(app);
  }

  /** @protected */
  async _uninstallApp(_app) {}

  installUtilBinaries() {}

  setInvokeFailuresListener(handler) {
    this._allAppsList().forEach(({ client }) => client.setEventCallback('testFailed', handler));
  }

  // TODO Instruments recording probably belongs in a separate (yet equivalent) driver framework,
  //  where recordingPath and samplingInterval could be computed within.
  //  Note: This set of drivers would have to have access to the apps state.

  async startInstrumentsRecording({ recordingPath, samplingInterval }) {
    const startClientRecording = ({ client }) =>
      ( client.isConnected ? client.startInstrumentsRecording(recordingPath, samplingInterval) : Promise.resolve() );

    const promises = this._allAppsList().map(startClientRecording);
    return Promise.all(promises);
  }

  async stopInstrumentsRecording() {
    const stopClientRecording = ({ client }) =>
      ( client.isConnected ? client.stopInstrumentsRecording() : Promise.resolve() );

    const promises = this._allAppsList().map(stopClientRecording);
    return Promise.all(promises);
  }

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

  async setPermissions(_permissions, appAlias) {}

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

  async _notifyAppReady(app) {
    await this.emitter.emit('appReady', {
      deviceId: this.getExternalId(),
      bundleId: app.appId,
      pid: app.pid,
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

  /** @protected */
  _getAppByAlias(appAlias) {
    return this._apps[appAlias || _unspecifiedAppAlias];
  }

  async _inferAllPreconfiguredAppIds() {
    await forEachSeries(Object.values(this._apps), async (app) => {
      app.appId = await this._inferAppId(app);
    });
  }

  /**
   * @protected
   */
  async _inferAppId(_app) { // eslint-disable-line no-unused-vars
    return '';
  }

  _validateLaunchApp(app) {
    if (!app.appId) {
      throw this.errorComposer.appNotSelected();
    }
  }
}

module.exports = RuntimeDriverBase;
