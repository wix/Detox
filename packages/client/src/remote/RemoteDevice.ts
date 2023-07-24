import { WebDriverClient } from '../webdriver';

export type RemoteDeviceConfig = {
  wd: WebDriverClient;
  info: RemoteDeviceInfo;
};

export type RemoteDeviceInfo = {
  id: string;
  name: string;
  platform: string;
  appLaunchArgs: any;
};

export class RemoteDevice {
  #wd: WebDriverClient;
  #info: RemoteDeviceInfo;

  constructor(config: RemoteDeviceConfig) {
    this.#wd = config.wd;
    this.#info = config.info;
  }

  /**
   * Holds the environment-unique ID of the device, namely, the adb ID on Android (e.g. emulator-5554) and the Mac-global simulator UDID on iOS -
   * as used by simctl (e.g. AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE).
   */
  get id() {
    return this.#info.id;
  }

  /**
   * Holds a descriptive name of the device. Example: emulator-5554 (Pixel_API_29)
   */
  get name() {
    return this.#info.name;
  }

  /**
   * Returns the current device, ios or android.
   *
   * @example
   * if (device.getPlatform() === 'ios') {
   *     await expect(loopSwitch).toHaveValue('1');
   * }
   */
  getPlatform() {
    return this.#info.platform;
  }

  get appLaunchArgs() {
    return this.#info.appLaunchArgs;
  }

  async captureViewHierarchy(name = 'capture') {
    const base64 = await this.#wd.http.session.post('/detox/captureViewHierarchy');
    return Buffer.from(base64, 'base64');
  }

  async clearKeychain() {
    await this.#wd.http.session.post('/detox/clearKeychain');
  }

  async disableSynchronization() {
    await this.#wd.http.session.post('/detox/disableSynchronization');
  }

  async enableSynchronization() {
    await this.#wd.http.session.post('/detox/enableSynchronization');
  }

  async installApp(binaryPath = undefined, testBinaryPath = undefined) {
    return this.#wd.http.session.post('/detox/installApp', {
      binaryPath,
      testBinaryPath,
    });
  }

  async installUtilBinaries() {
    await this.#wd.http.session.post('/detox/installUtilBinaries');
  }

  async launchApp(options = undefined, bundleId = undefined) {
    const payload = { ...options };
    if (bundleId) { payload.bundleId = bundleId; }

    return this.#wd.http.session.post('/detox/launchApp', payload);
  }

  async matchFace() {
    await this.#wd.http.session.post('/detox/matchFace');
  }

  async matchFinger() {
    await this.#wd.http.session.post('/detox/matchFinger');
  }

  async openURL(params = undefined): Promise<void> {
    await this.#wd.http.session.post('/detox/openURL', params);
  }

  async pressBack() {
    await this.#wd.http.session.post('/detox/pressBack');
  }

  async relaunchApp(options = undefined, bundleId = undefined) {
    const payload = { ...options, newInstance: true };
    if (bundleId) { payload.bundleId = bundleId; }

    return this.#wd.http.session.post('/detox/launchApp', payload);
  }

  async reloadReactNative(): Promise<void> {
    return this.#wd.http.session.post('/detox/reloadReactNative');
  }

  async resetContentAndSettings() {
    await this.#wd.http.session.post('/detox/resetContentAndSettings');
  }

  async resetStatusBar() {
    await this.#wd.http.session.post('/detox/resetStatusBar');
  }

  async selectApp(appAlias: string) {
    return this.#wd.http.session.post('/detox/selectApp', { appAlias });
  }

  async sendToHome() {
    await this.#wd.http.session.post('/detox/sendToHome');
  }

  async sendUserActivity(params) {
    await this.#wd.http.session.post('/detox/sendUserActivity', params);
  }

  async sendUserNotification(params) {
    await this.#wd.http.session.post('/detox/sendUserNotification', params);
  }

  async setBiometricEnrollment(toggle) {
    await this.#wd.http.session.post('/detox/setBiometricEnrollment', { toggle });
  }

  async setLocation(lat: number, lon: number) {
    await this.#wd.http.session.post('/detox/setLocation', { lat, lon });
  }

  async setOrientation(orientation) {
    await this.#wd.http.session.post('/detox/setOrientation', { orientation });
  }

  async setStatusBar(params) {
    await this.#wd.http.session.post('/detox/setStatusBar', params);
  }

  async setURLBlacklist(blacklist) {
    await this.#wd.http.session.post('/detox/setURLBlacklist', { blacklist });
  }

  async shake() {
    await this.#wd.http.session.post('/detox/shake');
  }

  async takeScreenshot() {
    const base64 = await this.#wd.http.takeScreenshot();
    return Buffer.from(base64, 'base64');
  }

  async terminateApp(bundleId = undefined) {
    await this.#wd.http.session.post('/detox/terminateApp', { bundleId });
  }

  async uninstallApp(bundleId = undefined) {
    return this.#wd.http.session.post('/detox/uninstallApp', {
      bundleId,
    });
  }

  async unmatchFace() {
    await this.#wd.http.session.post('/detox/unmatchFace');
  }

  async unmatchFinger() {
    await this.#wd.http.session.post('/detox/unmatchFinger');
  }
}
