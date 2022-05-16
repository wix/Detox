// @ts-nocheck
const os = require('os');
const path = require('path');

const fs = require('fs-extra');
const _ = require('lodash');

const log = require('../../../utils/logger').child({ __filename });

/**
 * @typedef App
 * @property alias { String }
 * @property client { Client }
 */

/**
 * @typedef DeviceDriverDeps
 * @property apps { Object.<String, App> }
 * @property eventEmitter { AsyncEmitter }
 */

class RuntimeDriverBase {
  /**
   * @param deps { DeviceDriverDeps }
   * @param configs {{ appsConfig: Object }}
   */
  constructor({ apps, eventEmitter }, configs) {
    this.emitter = eventEmitter;

    this._apps = apps;
    this._selectedApp = '';
    this._processes = {};

    _.forEach(apps, (app, alias) =>
      app.client.terminateApp = () => this.terminate(TODO)); // TODO (multiapps) alias to bundleId!!!
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
   * // TODO (multiapps) unit-test
   * @returns {string} App alias.
   */
  get selectedApp() {
    return this._selectedApp.alias;
  }

  // TODO (multiapps) unit-test
  selectApp(appAlias) {
    this._selectedApp = this._apps[appAlias];
  }

  // TODO (multiapps) unit-test
  clearSelectedApp() {
    this._selectedApp = null;
  }

  get invocationManager() {
    return this._selectedApp.invocationManager;
  }

  get client() {
    return this._selectedApp.client;
  }

  // TODO (multiapps) unit-test
  isAppRunning(appId) {
    return (this._processes[appId] != null); // TODO (multiapps) Change to '!==' ???
  }

  // TODO (multiapps) unit-test this addition
  async onTestEnd(testSummary) {
    this._dumpUnhandledErrorsIfAny(testSummary);
  }

  async installApp(_binaryPath, _testBinaryPath) {}
  async uninstallApp() {}
  installUtilBinaries() {}

  async launchApp(appId, launchArgs, languageAndLocale) {
    this._processes[appId] = await this._launchApp(appId, launchArgs, languageAndLocale);

    // TODO (multiapps) unit-test this addition
    await this.waitUntilReady();
    await this.waitForActive();

    // TODO (multiapps) unit-test this addition
    await this._notifyAppReady(appId);
  }

  async waitForAppLaunch(appId, launchArgs, languageAndLocale) {
    this._processes[appId] = await this._waitForAppLaunch(appId, launchArgs, languageAndLocale);

    // TODO (multiapps) unit-test this addition
    await this._notifyAppReady(appId);
  }

  async terminate(_bundleId) {}

  async waitUntilReady() {
    return await this.client.waitUntilReady();
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

  async setPermissions(_bundleId, _permissions) {}

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

  getBundleIdFromBinary(_appPath) {
    return '';
  }

  validateDeviceConfig(_deviceConfig) {
  }

  getPlatform() {
    return '';
  }

  async getUiDevice() {
    log.warn(`getUiDevice() is an Android-specific function, it exposes UiAutomator's UiDevice API (https://developer.android.com/reference/android/support/test/uiautomator/UiDevice).`);
    log.warn(`Make sure you create an Android-specific test for this scenario.`);

    return undefined;
  }

  async cleanup(appId) {
    this.emitter.off(); // clean all listeners
    await this._cleanupApps(); // TODO (multiapps) unit-test
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

  _launchApp() {}
  _waitForAppLaunch() {}

  async _notifyAppReady(appId) {
    await this.emitter.emit('appReady', {
      deviceId: this.getExternalId(),
      bundleId: appId, // TODO (multiapps) can rename bundleId to appId?
      pid: this._processes[appId],
    });
  }

  // TODO (multiapps) unit-test this addition
  async _cleanupApps() {
    const promises = this._apps.map(({ client }) => {
      client.dumpPendingRequests();
      return client.cleanup();
    });
    return Promise.all(promises);
  }

  _dumpUnhandledErrorsIfAny({ testName, pendingRequests }) {
    if (pendingRequests) {
      this._apps.forEach(({ client }) => client.dumpPendingRequests({ testName }));
    }
  }
}

module.exports = RuntimeDriverBase;
