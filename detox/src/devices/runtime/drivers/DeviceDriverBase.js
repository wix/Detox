// @ts-nocheck
const os = require('os');
const path = require('path');

const fs = require('fs-extra');

const log = require('../../../utils/logger').child({ __filename });

/**
 * @typedef DeviceDriverDeps
 * @property client { Client }
 * @property eventEmitter { AsyncEmitter }
 */

class RuntimeDriverBase {
  /**
   * @param deps { DeviceDriverDeps }
   */
  constructor({ client, eventEmitter }) {
    this.client = client;
    this.emitter = eventEmitter;

    this._apps = {};
    this._selectedApp = null;
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

  get selectedApp() {
    return this._selectedApp;
  }

  selectApp(appAlias) {
    this._selectedApp = this._apps[appAlias];
  }

  clearSelectedApp() {
    this._selectedApp = null;
  }

  get invocationManager() {
    return this._selectedApp.invocationManager;
  }

  async installApp(_binaryPath, _testBinaryPath) {}
  async uninstallApp() {}
  installUtilBinaries() {}

  async launchApp() {}
  async terminate(_bundleId) {}
  async waitForAppLaunch() {}

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

  async cleanup(_bundleId) {
    this.emitter.off(); // clean all listeners
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
}

module.exports = RuntimeDriverBase;
