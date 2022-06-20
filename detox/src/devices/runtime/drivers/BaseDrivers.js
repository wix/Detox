const fs = require('fs-extra');

const { DetoxInternalError } = require('../../../errors');
const tempFile = require('../../../utils/tempFile');

function throwNotImplemented(func) {
  throw new DetoxInternalError(`Oops! Function '${func.name}' was left unimplemented!`);
}

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

  // TODO (multiapps) Where should this be called from?
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
 * @typedef { Object } LaunchArgs
 * @property [detoxURLOverride] { String }
 * @property [detoxUserNotificationDataURL] { Object }
 * @property [detoxUserActivityDataURL] { Object }
 */

/**
 * @typedef { Object } LaunchInfo
 * @property userLaunchArgs { LaunchArgs }
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

  setDisconnectListener(listener) {
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
  async launch(_launchInfo) { throwNotImplemented(this.launch); }

  /**
   * @param _launchInfo { LaunchInfo }
   */
  async waitForLaunch(_launchInfo) { throwNotImplemented(this.waitForLaunch); }

  /**
   * @param _params {{ url: String, sourceApp: (String|undefined) }}
   */
  async openURL(_params) { throwNotImplemented(this.openURL); }
  async reloadReactNative() { throwNotImplemented(this.reloadReactNative); }
  async resetContentAndSettings() {}

  async sendUserActivity(payload) {
    await this._sendPayload('detoxUserActivityDataURL', payload);
  }

  async sendUserNotification(payload) {
    await this._sendPayload('detoxUserNotificationDataURL', payload);
  }

  async terminate() {
    this._pid = null;
  }

  async invoke(_action) {
    throwNotImplemented(this.invoke);
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
  async captureViewHierarchy(_name) {}
  async cleanup() {
    this.client.dumpPendingRequests();
    await this.client.cleanup();
    this.client = null;
  }

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

  /** @protected */
  async _waitUntilReady() {
    return this.client.waitUntilReady();
  }

  /** @protected */
  async _sendPayload(name, payload) {
    const payloadFile = this._createPayloadFile(payload);

    await this._deliverPayload({
      [name]: payloadFile.path,
    });
    payloadFile.cleanup();
  }

  /** @protected */
  async _deliverPayload(_payload) {
    throwNotImplemented(this._deliverPayload);
  }

  /** @protected */
  _createPayloadFile(payload) {
    const payloadFile = tempFile.create('payload.json');
    fs.writeFileSync(payloadFile.path, JSON.stringify(payload, null, 2));
    return payloadFile;
  }

  /** @protected */
  async _notifyBeforeAppLaunch(deviceId, bundleId, launchArgs) {
    await this.emitter.emit('beforeLaunchApp', { bundleId, deviceId, launchArgs });
  }

  /** @protected */
  async _notifyAppLaunch(deviceId, bundleId, launchArgs, pid) {
    await this.emitter.emit('launchApp', { bundleId, deviceId, launchArgs, pid });
  }

  /** @protected */
  async _notifyAppReady(deviceId, bundleId, pid) {
    await this.emitter.emit('appReady', { deviceId, bundleId, pid });
  }
}

module.exports = {
  TestAppDriver,
  DeviceDriver,
};
