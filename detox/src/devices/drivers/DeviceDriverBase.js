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

  async acquireFreeDevice(_deviceQuery) {
    return await Promise.resolve('');
  }

  async prepare() {
    return await Promise.resolve('');
  }

  async launchApp() {
    return await Promise.resolve(NaN);
  }

  async waitForAppLaunch() {
    return await Promise.resolve(NaN);
  }

  async takeScreenshot(_deviceId, _screenshotName) {
    return await Promise.resolve('');
  }

  async sendToHome() {
    return await Promise.resolve('');
  }

  async setBiometricEnrollment() {
    return await Promise.resolve('');
  }

  async matchFace() {
    return await Promise.resolve('');
  }

  async unmatchFace() {
    return await Promise.resolve('');
  }

  async matchFinger() {
    return await Promise.resolve('');
  }

  async unmatchFinger() {
    return await Promise.resolve('');
  }

  async shake() {
    return await Promise.resolve('');
  }

  async installApp(_deviceId, _binaryPath, _testBinaryPath) {
    return await Promise.resolve('');
  }

  async uninstallApp() {
    return await Promise.resolve('');
  }

  installUtilBinaries() {
    return Promise.resolve('');
  }

  async deliverPayload(params) {
    return await this.client.deliverPayload(params);
  }

  async setLocation(_lat, _lon) {
    return await Promise.resolve('');
  }

  async reverseTcpPort() {
    return await Promise.resolve('');
  }

  async unreverseTcpPort() {
    return await Promise.resolve('');
  }

  async clearKeychain(_udid) {
    return await Promise.resolve('');
  }

  async waitUntilReady() {
    return await this.client.waitUntilReady();
  }

  async waitForActive() {
    return await Promise.resolve('');
  }

  async waitForBackground() {
    return await Promise.resolve('');
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
    return await Promise.resolve('');
  }

  async terminate(_deviceId, _bundleId) {
    return await Promise.resolve('');
  }

  async shutdown() {
    return await Promise.resolve('');
  }

  async setOrientation(_deviceId, _orientation) {
    return await Promise.resolve('');
  }

  async setURLBlacklist(_urlList) {
    return await Promise.resolve('');
  }

  async enableSynchronization() {
    return await Promise.resolve('');
  }

  async disableSynchronization() {
    return await Promise.resolve('');
  }

  async resetContentAndSettings() {
    return await Promise.resolve('');
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
  }

  validateDeviceConfig(_deviceConfig) {
  }

  getPlatform() {
  }

  async getUiDevice() {
    log.warn(`getUiDevice() is an android specific function, it exposes UiAutomator's UiDevice API (https://developer.android.com/reference/android/support/test/uiautomator/UiDevice) make sure you create an android specific test for this scenario`);
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
    log.warn('pressBack() is an android specific function, make sure you create an android specific test for this scenario');
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
