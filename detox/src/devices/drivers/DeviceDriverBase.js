const os = require('os');
const path = require('path');

const fs = require('fs-extra');

const log = require('../../utils/logger').child({ __filename });

class DeviceDriverBase {
  constructor({ client, emitter }) {
    this.client = client;
    this.emitter = emitter;
  }

  get name() {
    return 'UNSPECIFIED_DEVICE';
  }

  getExternalId(deviceId) {
    return deviceId;
  }

  declareArtifactPlugins() {
    return {};
  }

  async acquireFreeDevice(_deviceQuery, _deviceConfig) {
    return '';
  }

  async prepare() {
    return '';
  }

  async launchApp() {
    return NaN;
  }

  async waitForAppLaunch() {
    return NaN;
  }

  async takeScreenshot(_deviceId, _screenshotName) {
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

  async installApp(_deviceId, _binaryPath, _testBinaryPath) {
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

  async setPermissions(_deviceId, _bundleId, _permissions) {
    return '';
  }

  async terminate(_deviceId, _bundleId) {
    return '';
  }

  async shutdown() {
    return '';
  }

  async setOrientation(_deviceId, _orientation) {
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

  async cleanup(_deviceId, _bundleId) {
    this.emitter.off(); // clean all listeners
  }

  getLogsPaths(_deviceId) {
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

  async typeText(_deviceId, _text) {
    return await Promise.resolve('');
  }

  async setStatusBar(_deviceId, _flags) {
  }

  async resetStatusBar(_deviceId) {
  }

  async captureViewHierarchy() {
    return '';
  }
}

module.exports = DeviceDriverBase;
