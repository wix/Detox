const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const log = require('../../utils/logger').child({ __filename });

class DeviceDriverBase {
  constructor({ client, emitter }) {
    this.client = client;
    this.emitter = emitter;
  }

  declareArtifactPlugins() {
    return {};
  }

  async acquireFreeDevice(deviceQuery) {
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

  async takeScreenshot(deviceId, screenshotName) {
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

  async installApp(deviceId, binaryPath, testBinaryPath) {
    return '';
  }

  async uninstallApp() {
    return '';
  }

  installUtilBinaries() {
    return Promise.resolve('');
  }

  async deliverPayload(params) {
    return await this.client.deliverPayload(params);
  }

  async setLocation(lat, lon) {
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

  async setPermissions(deviceId, bundleId, permissions) {
    return '';
  }

  async terminate(deviceId, bundleId) {
    return '';
  }

  async shutdown() {
    return '';
  }

  async setOrientation(deviceId, orientation) {
    return '';
  }

  async setURLBlacklist(urlList) {
    return '';
  }

  async enableSynchronization() {
    return '';
  }

  async disableSynchronization() {
    return '';
  }

  async resetContentAndSettings() {
    return '';
  }

  createRandomDirectory() {
    const randomDir = fs.mkdtempSync(path.join(os.tmpdir(), 'detoxrand-'));
    fs.ensureDirSync(randomDir);
    return randomDir;
  }

  cleanupRandomDirectory(fileOrDir) {
    if (path.basename(fileOrDir).startsWith('detoxrand-')) {
      fs.removeSync(fileOrDir);
    }
  }

  getBundleIdFromBinary(appPath) {
  }

  validateDeviceConfig(deviceConfig) {
  }

  getPlatform() {
  }

  async getUiDevice() {
    log.warn(`getUiDevice() is an android specific function, it exposes UiAutomator's UiDevice API (https://developer.android.com/reference/android/support/test/uiautomator/UiDevice) make sure you create an android specific test for this scenario`);
    return '';
  }

  async cleanup(deviceId, bundleId) {
    this.emitter.off(); // clean all listeners
  }

  getLogsPaths(deviceId) {
    return {
      stdout: undefined,
      stderr: undefined
    };
  }

  async pressBack() {
    log.warn('pressBack() is an android specific function, make sure you create an android specific test for this scenario');
    return '';
  }

  async typeText(deviceId, text) {
    return '';
  }

  async setStatusBar(deviceId, flags) {
  }

  async resetStatusBar(deviceId) {
  }

  async captureViewHierarchy() {
    return '';
  }
}

module.exports = DeviceDriverBase;
