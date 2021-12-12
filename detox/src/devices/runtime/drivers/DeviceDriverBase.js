const os = require('os');
const path = require('path');

const fs = require('fs-extra');

const log = require('../../../utils/logger').child({ __filename });

/**
 * @typedef DeviceDriverDeps
 * @property client { Client }
 * @property eventEmitter { AsyncEmitter }
 */

class DeviceDriverBase {
  /**
   * @param deps { DeviceDriverDeps }
   */
  constructor({ client, eventEmitter }) {
    this.client = client;
    this.emitter = eventEmitter;
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

  declareArtifactPlugins() {
    return {};
  }

  async launchApp() {
    return NaN;
  }

  async waitForAppLaunch() {
    return NaN;
  }

  async takeScreenshot(_screenshotName) {
    return '';
  }

  async sendToHome() {
    return '';
  }

  async setBiometricEnrollment() {
    return '';
  }

  async matchFace() {
    return '';
  }

  async unmatchFace() {
    return '';
  }

  async matchFinger() {
    return '';
  }

  async unmatchFinger() {
    return '';
  }

  async shake() {
    return '';
  }

  async installApp(_binaryPath, _testBinaryPath) {
    return '';
  }

  async uninstallApp() {
    return '';
  }

  installUtilBinaries() {
    return '';
  }

  async deliverPayload(params) {
    return await this.client.deliverPayload(params);
  }

  async setLocation(_lat, _lon) {
    return '';
  }

  async reverseTcpPort() {
    return '';
  }

  async unreverseTcpPort() {
    return '';
  }

  async clearKeychain(_udid) {
    return '';
  }

  async waitUntilReady() {
    return await this.client.waitUntilReady();
  }

  async waitForActive() {
    return '';
  }

  async waitForBackground() {
    return '';
  }

  async reloadReactNative() {
    return await this.client.reloadReactNative();
  }

  createPayloadFile(notification) {
    const notificationFilePath = path.join(this.createRandomDirectory(), `payload.json`);
    fs.writeFileSync(notificationFilePath, JSON.stringify(notification, null, 2));
    return notificationFilePath;
  }

  async setPermissions(_bundleId, _permissions) {
    return '';
  }

  async terminate(_bundleId) {
    return '';
  }

  async setOrientation(_orientation) {
    return '';
  }

  async setURLBlacklist(_urlList) {
    return '';
  }

  async enableSynchronization() {
    return '';
  }

  async disableSynchronization() {
    return '';
  }

  async resetContentAndSettings(_deviceId, _deviceConfig) {
    return '';
  }

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

    return await Promise.resolve('');
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

    return await Promise.resolve('');
  }

  async typeText(_text) {
    return await Promise.resolve('');
  }

  async setStatusBar(_flags) {
  }

  async resetStatusBar() {
  }

  async captureViewHierarchy() {
    return '';
  }
}

module.exports = DeviceDriverBase;
