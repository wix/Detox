const _ = require('lodash');

const wrapWithStackTraceCutter = require('./utils/wrapWithStackTraceCutter');

class DeviceAPI {

  /**
   * @param device { RuntimeDevice }
   * @param errorComposer { DetoxRuntimeErrorComposer }
   */
  constructor(device, errorComposer) {
    // wrapWithStackTraceCutter(this, [ // TODO (multiapps) replace with Object.keys() ?
    //   'captureViewHierarchy',
    //   'clearKeychain',
    //   'disableSynchronization',
    //   'enableSynchronization',
    //   'installApp',
    //   'launchApp',
    //   'matchFace',
    //   'matchFinger',
    //   'openURL',
    //   'pressBack',
    //   'relaunchApp',
    //   'reloadReactNative',
    //   'resetContentAndSettings',
    //   'resetStatusBar',
    //   'reverseTcpPort',
    //   'selectApp',
    //   'sendToHome',
    //   'sendUserActivity',
    //   'sendUserNotification',
    //   'setBiometricEnrollment',
    //   'setLocation',
    //   'setOrientation',
    //   'setStatusBar',
    //   'setURLBlacklist',
    //   'shake',
    //   'takeScreenshot',
    //   'terminateApp',
    //   'uninstallApp',
    //   'unmatchFace',
    //   'unmatchFinger',
    //   'unreverseTcpPort',
    // ]);

    this.device = device;

    this._errorComposer = errorComposer;
  }

  get id() {
    return this.device.id;
  }

  get name() {
    return this.device.name;
  }

  get type() {
    return this.device.type;
  }

  get platform() {
    return this.device.platform;
  }

  /**
   * @deprecated Use 'platform'
   */
  getPlatform() {
    return this.platform;
  }

  get appLaunchArgs() {
    return this.device.selectedApp.launchArgs;
  }

  async selectApp(aliasOrConfig) {
    if (aliasOrConfig === undefined) {
      throw this._errorComposer.cantSelectEmptyApp();
    }

    let alias;
    if (_.isObject(aliasOrConfig)) {
      const appConfig = aliasOrConfig;
      await this.device.selectUnspecifiedApp(appConfig);
    } else {
      alias = aliasOrConfig;
      await this.device.selectPredefinedApp(alias);
    }
  }

  /** TODO (multiapps) Contract change: no appId; Only works on currently selected app */
  async launchApp(params = {}) {
    return this.device.selectedApp.launch(params);
  }

  /**
   * @deprecated
   */
  async relaunchApp(params = {}) {
    if (params.newInstance === undefined) {
      params.newInstance = true;
    }
    return this.launchApp(params);
  }

  async takeScreenshot(name) {
    return this.device.takeScreenshot(name);
  }

  async captureViewHierarchy(name = 'capture') {
    return this.device.captureViewHierarchy(name);
  }

  async sendToHome() {
    return this.device.selectedApp.sendToHome();
  }

  async pressBack() {
    return this.device.selectedApp.pressBack();
  }

  async setBiometricEnrollment(toggle) {
    const yesOrNo = toggle ? 'YES' : 'NO';
    return this.device.setBiometricEnrollment(yesOrNo);
  }

  async matchFace() {
    await this.device.selectedApp.matchFace();
  }

  async unmatchFace() {
    return this.device.selectedApp.unmatchFace();
  }

  async matchFinger() {
    return this.device.selectedApp.matchFinger();
  }

  async unmatchFinger() {
    return this.device.selectedApp.unmatchFinger();
  }

  async shake() {
    return this.device.selectedApp.shake();
  }

  async setOrientation(orientation) {
    return this.device.selectedApp.setOrientation(orientation);
  }

  // TODO (multiapps) contract change: no freestyle app ID accepted anymore
  async terminateApp() {
    return this.device.selectedApp.terminate();
  }

  // TODO (multiapps) contract change: no freestyle installs with app/apk path(s)
  async installApp() {
    return this.device.selectedApp.install();
  }

  // TODO (multiapps) contract change: no freestyle app ID accepted anymore
  async uninstallApp() {
    return this.device.selectedApp.uninstall();
  }

  async reloadReactNative() {
    return this.device.selectedApp.reloadReactNative();
  }

  async openURL(params) {
    return this.device.selectedApp.openURL(params);
  }

  async setLocation(lat, lon) {
    return this.device.setLocation(lat, lon);
  }

  async reverseTcpPort(port) {
    return this.device.reverseTcpPort(port);
  }

  async unreverseTcpPort(port) {
    return this.device.unreverseTcpPort(port);
  }

  async clearKeychain() {
    return this.device.clearKeychain();
  }

  async sendUserActivity(payload) {
    return this.device.selectedApp.sendUserActivity(payload);
  }

  async sendUserNotification(payload) {
    return this.device.selectedApp.sendUserNotification(payload);
  }

  async setURLBlacklist(urlList) {
    return this.device.selectedApp.setURLBlacklist(urlList);
  }

  async enableSynchronization() {
    return this.device.selectedApp.enableSynchronization();
  }

  async disableSynchronization() {
    return this.device.selectedApp.disableSynchronization();
  }

  async resetContentAndSettings() {
    return this.device.selectedApp.resetContentAndSettings();
  }

  getUiDevice() {
    return this.device.selectedApp.uiDevice;
  }

  async setStatusBar(params) {
    return this.device.setStatusBar(params);
  }

  async resetStatusBar() {
    return this.device.resetStatusBar();
  }
}

module.exports = DeviceAPI;
