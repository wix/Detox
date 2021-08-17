/**
 * The ultimate _device_ external API
 */
class Device {
  constructor({ allocationDevice, runtimeDevice, matchers }) {
    this._allocationDevice = allocationDevice;
    this._runtimeDevice = runtimeDevice;
    this._matchers = matchers;
  }

  get name() {
    return this._runtimeDevice.name;
  }

  get id() {
    return this._runtimeDevice.id;
  }

  get type() {
    return this._runtimeDevice.type;
  }

  get appLaunchArgs() {
    return this._runtimeDevice.appLaunchArgs;
  }

  getPlatform() {
    return this._runtimeDevice.getPlatform();
  }

  async selectApp(name) {
    await this._runtimeDevice.selectApp(name);

    // Sometime, in the near future?
    // await this._matchers.selectApp(name);
  }

  launchApp(params, bundleId) {
    return this._runtimeDevice.launchApp(params, bundleId);
  }

  /**
   * @deprecated
   */
  relaunchApp(params, bundleId) {
    return this._runtimeDevice.relaunchApp(params, bundleId);
  }

  installApp(binaryPath, testBinaryPath) {
    return this._runtimeDevice.installApp(binaryPath, testBinaryPath);
  }

  uninstallApp(bundleId) {
    return this._runtimeDevice.uninstallApp(bundleId);
  }

  openURL(params) {
    return this._runtimeDevice.openURL(params);
  }

  reloadReactNative() {
    return this._runtimeDevice.reloadReactNative();
  }

  terminateApp(bundleId) {
    return this._runtimeDevice.terminateApp(bundleId);
  }

  async shutdown() {
    try {
      await this._runtimeDevice.shutdown();
    } finally {
      await this._allocationDevice.free({ shutdown: true }) // TODO ASDASD So looks like the drivers _will_ need to hold the cookie
    }
  }

  takeScreenshot(name) {
    return this._runtimeDevice.takeScreenshot(name);
  }

  captureViewHierarchy(name = 'capture') {
    return this._runtimeDevice.captureViewHierarchy(name);
  }

  sendToHome() {
    return this._runtimeDevice.sendToHome();
  }

  setBiometricEnrollment(toggle) {
    return this._runtimeDevice.setBiometricEnrollment(toggle);
  }

  matchFace() {
    return this._runtimeDevice.matchFace();
  }

  unmatchFace() {
    return this._runtimeDevice.unmatchFace();
  }

  matchFinger() {
    return this._runtimeDevice.matchFinger();
  }

  unmatchFinger() {
    return this._runtimeDevice.unmatchFinger();
  }

  shake() {
    return this._runtimeDevice.shake();
  }

  setOrientation(orientation) {
    return this._runtimeDevice.setOrientation(orientation);
  }

  setLocation(lat, lon) {
    return this._runtimeDevice.setLocation(lat, lon);
  }

  reverseTcpPort(port) {
    return this._runtimeDevice.reverseTcpPort(port);
  }

  unreverseTcpPort(port) {
    return this._runtimeDevice.unreverseTcpPort(port);
  }

  clearKeychain() {
    return this._runtimeDevice.clearKeychain();
  }

  sendUserActivity(params) {
    return this._runtimeDevice.sendUserActivity(params);
  }

  sendUserNotification(params) {
    return this._runtimeDevice.sendUserNotification(params);
  }

  setURLBlacklist(urlList) {
    return this._runtimeDevice.setURLBlacklist(urlList);
  }

  enableSynchronization() {
    return this._runtimeDevice.enableSynchronization();
  }

  disableSynchronization() {
    return this._runtimeDevice.disableSynchronization();
  }

  resetContentAndSettings() {
    return this._runtimeDevice.resetContentAndSettings();
  }

  pressBack() {
    return this._runtimeDevice.pressBack();
  }

  getUiDevice() {
    return this._runtimeDevice.getUiDevice();
  }

  setStatusBar(params) {
    return this._runtimeDevice.setStatusBar(params);
  }

  resetStatusBar() {
    return this._runtimeDevice.resetStatusBar();
  }
}

module.exports = Device;
