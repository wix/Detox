const fs = require('fs-extra');

const tempFile = require('../../../utils/tempFile');

/**
 * @typedef DeviceDriverDeps
 * @property eventEmitter { AsyncEmitter }
 */

class DeviceDriver {
  /**
   * @param deps { DeviceDriverDeps }
   */
  constructor({ eventEmitter }) {
    this.emitter = eventEmitter;
  }

  /**
   * @returns { String | undefined }
   */
  get externalId() {
    return undefined;
  }

  /**
   * @returns { String | undefined }
   */
  get deviceName() {
    return undefined;
  }

  /**
   * @returns { String }
   */
  get platform() {
    return '';
  }

  validateDeviceConfig(_deviceConfig) {}

  async takeScreenshot(_screenshotName) {}
  async setBiometricEnrollment() {}
  async setStatusBar(_params) {}
  async resetStatusBar() {}
  async setLocation(_lat, _lon) {}
  async reverseTcpPort(_port) {}
  async unreverseTcpPort(_port) {}
  async clearKeychain() {}
  async typeText(_text) {}
  async cleanup() {}
}

/**
 * @typedef TestAppDriverDeps
 * @property client { Client }
 * @property invocationManager { InvocationManager }
 * @property eventEmitter { AsyncEmitter }
 */

/**
 * @typedef AppInfo
 * @property binaryPath { String }
 */

/**
 * @typedef LaunchInfo
 * @property launchArgs { Object }
 */

class TestAppDriver {

  /**
   * @param deps { TestAppDriverDeps }
   */
  constructor({ client, invocationManager, eventEmitter }) {
    this.client = client;
    this.invocationManager = invocationManager;
    this.emitter = eventEmitter;

    this._pid = null;
    this._appInfo = null;
  }

  async init() {
    await this.client.connect();
  }

  get uiDevice() {
    return null;
  }

  /**
   * @returns {boolean} Whether the app is currently running
   */
  isRunning() {
    return !!this._pid;
  }

  setOnDisconnectListener(listener) {
    this.client.terminateApp = listener;
  }

  /**
   * @param appInfo { AppInfo }
   */
  async select(appInfo) {
    this._appInfo = appInfo;
  }

  async deselect() {
    this._appInfo = null;
  }

  /**
   * @param _launchInfo { LaunchInfo }
   */
  async launch(_launchInfo) {}

  /**
   * @param _launchInfo { LaunchInfo }
   */
  async waitForLaunch(_launchInfo) {}

  async reloadReactNative() {}
  async resetContentAndSettings() {}

  async deliverPayload(_params) {} // TODO (multiapps) Revisit whether keeping this method public makes sense at all

  async sendUserActivity(payload) {
    await this._sendPayload('detoxUserActivityDataURL', payload);
  }

  async sendUserNotification(payload) {
    await this._sendPayload('detoxUserNotificationDataURL', payload);
  }

  async terminate() {
    this._pid = null;
  }

  async invoke(_action) {}

  setInvokeFailuresListener(listener) {
    this.client.setEventCallback('testFailed', listener);
  }

  async startInstrumentsRecording({ recordingPath, samplingInterval }) {
    const { client } = this;
    if (client.isConnected) {
      return client.startInstrumentsRecording(recordingPath, samplingInterval);
    }
  }

  async stopInstrumentsRecording() {
    const { client } = this;
    if (client.isConnected) {
      return client.stopInstrumentsRecording();
    }
  }

  async install() {}
  async uninstall() {}

  async setOrientation(_orientation) {}
  async setPermissions(_permissions) {}
  async sendToHome() {}
  async pressBack() {}
  async matchFace() {}
  async unmatchFace() {}
  async matchFinger() {}
  async unmatchFinger() {}
  async shake() {}
  async setURLBlacklist(_urlList) {}
  async enableSynchronization() {}
  async disableSynchronization() {}
  async captureViewHierarchy() {}
  async cleanup() {
    this.client.dumpPendingRequests();
    await this.client.cleanup();
    this.client = null;
  }

  /** @protected */
  async _waitUntilReady() {
    return this.client.waitUntilReady();
  }

  /** @protected */
  _createPayloadFile(payload) {
    const payloadFile = tempFile.create('payload.json');
    fs.writeFileSync(payloadFile.path, JSON.stringify(payload, null, 2));
    return payloadFile;
  }

  async _sendPayload(name, payload) {
    const payloadFile = this._createPayloadFile(payload);

    await this.deliverPayload({
      [name]: payloadFile.path,
    });
    payloadFile.cleanup();
  }

  async _notifyAppReady(deviceId, bundleId) {
    await this.emitter.emit('appReady', {
      deviceId,
      bundleId,
      pid: this._pid,
    });
  }
}


module.exports = {
  DeviceDriver,
  TestAppDriver,
};
