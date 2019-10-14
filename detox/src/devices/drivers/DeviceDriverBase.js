const _ = require('lodash');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const AsyncEmitter = require('../../utils/AsyncEmitter');
const log = require('../../utils/logger').child({ __filename });

class DeviceDriverBase {
  constructor({ client }) {
    this.client = client;
    this.matchers = null;
    this.emitter = new AsyncEmitter({
      events: [
        'bootDevice',
        'beforeShutdownDevice',
        'shutdownDevice',
        'beforeTerminateApp',
        'beforeUninstallApp',
        'beforeLaunchApp',
        'launchApp',
        'userAction',
      ],
      onError: this._onEmitError.bind(this),
    });
  }

  get name() {
    return 'UNSPECIFIED_DEVICE';
  }

  off(event, listener) {
    this.emitter.off(event, listener);
  }

  on(event, listener) {
    this.emitter.on(event, listener);
  }

  declareArtifactPlugins() {
    return {};
  }

  async acquireFreeDevice(name) {
    await Promise.resolve('');
  }

  async prepare() {
    return await Promise.resolve('');
  }

  async launchApp() {
    return await Promise.resolve('');
  }

  async takeScreenshot(name) {
    await this.emitter.emit('userAction', {
      type: 'takeScreenshot',
      options: { name },
    });
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

  async installApp() {
    return await Promise.resolve('');
  }

  async uninstallApp() {
    return await Promise.resolve('');
  }

  async deliverPayload(params) {
    return await this.client.deliverPayload(params);
  }

  async setLocation(lat, lon) {
    return await Promise.resolve('');
  }

  async clearKeychain(_udid) {
    return await Promise.resolve('')
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

  }

  async setPermissions(deviceId, bundleId, permissions) {
    return await Promise.resolve('');
  }

  async terminate(deviceId, bundleId) {
    return await Promise.resolve('');
  }

  async shutdown() {
    return await Promise.resolve('');
  }

  async setOrientation(deviceId, orientation) {
    return await Promise.resolve('');
  }

  async setURLBlacklist(urlList) {
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

  getBundleIdFromBinary(appPath) {

  }

  validateDeviceConfig(deviceConfig) {

  }

  getPlatform() {

  }

  async getUiDevice() {
    log.warn(`getUiDevice() is an android specific function, it exposes UiAutomator's UiDevice API (https://developer.android.com/reference/android/support/test/uiautomator/UiDevice) make sure you create an android specific test for this scenario`);
    return await Promise.resolve('');
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
    return await Promise.resolve('');
  }

  _onEmitError({ error, eventName, eventObj }) {
    log.error(
      { event: 'EMIT_ERROR', className: this.constructor.name, eventName },
      `Caught an exception in: emitter.emit("${eventName}", ${JSON.stringify(eventObj)})\n\n`,
      error
    );
  }
}

module.exports = DeviceDriverBase;
