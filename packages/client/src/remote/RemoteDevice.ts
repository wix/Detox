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

  async getCurrentApp() {
    return this.#wd.http.getWindowHandle();
  }

  /**
   * Select the current app (relevant only to multi-app configs) by its name.
   * After execution, all app-specific device methods will target the selected app.
   *
   * @see DetoxAppConfig#name
   * @example
   * await device.selectApp('passenger');
   * await device.launchApp(); // passenger
   * // ... run tests for the passenger app
   * await device.uninstallApp(); // passenger
   * await device.selectApp('driver');
   * await device.installApp(); // driver
   * await device.launchApp(); // driver
   * // ... run tests for the driver app
   * await device.terminateApp(); // driver
   */
  async selectApp(appAlias: string) {
    return this.#wd.http.switchToWindow(appAlias);
  }

  async terminateApp() {
    return this.#wd.http.closeWindow();
  }

  async launchApp(options) {
    return this.#wd.http.newWindow(options);
  }

  async relaunchApp() {
    return this.#wd.http.refreshPage();
  }

  /**
   * Send application to background by bringing com.apple.springboard to the foreground.
   * Combining sendToHome() with launchApp({newInstance: false}) will simulate app coming back from background.
   * @example
   * await device.sendToHome();
   * await device.launchApp({newInstance: false});
   */
  async sendToHome() {
    return this.#wd.http.session.post('/detox/sendToHome');
  }

  /**
   * By default, installApp() with no params will install the app file defined in the current configuration.
   * To install another app, specify its path
   * @example await device.installApp();
   * @example await device.installApp('path/to/other/app');
   */
  async installApp(binaryPath, testBinaryPath) {
    return this.#wd.http.session.post('/detox/installApp', {
      binaryPath,
      testBinaryPath,
    });
  }

  async uninstallApp(bundleId) {
    return this.#wd.http.session.post('/detox/uninstallApp', {
      bundleId,
    });
  }

  /**
   * If this is a React Native app, reload the React Native JS bundle. This action is much faster than device.launchApp(), and can be used if you just need to reset your React Native logic.
   *
   * @example await device.reloadReactNative()
   */
  async reloadReactNative(): Promise<void> {
    return this.#wd.http.session.post('/detox/reloadReactNative');
  }

  /**
   * Mock opening the app from URL. sourceApp is an optional parameter to specify source application bundle id.
   */
  async openURL({ url, sourceApp }: { url: string; sourceApp?: string }): Promise<void> {
    return this.#wd.http.navigateTo(url);
  }

  /**
   * Takes a screenshot on the device and schedules putting it in the artifacts folder upon completion of the current test.
   * @param name for the screenshot artifact
   * @returns a temporary path to the screenshot.
   * @example
   * test('Menu items should have logout', async () => {
   *   const tempPath = await device.takeScreenshot('tap on menu');
   *   // The temporary path will remain valid until the test completion.
   *   // Afterwards, the screenshot will be moved, e.g.:
   *   // * on success, to: <artifacts-location>/✓ Menu items should have Logout/tap on menu.png
   *   // * on failure, to: <artifacts-location>/✗ Menu items should have Logout/tap on menu.png
   * });
   */
  async takeScreenshot(name: string) {
    const base64 = await this.#wd.http.takeScreenshot();
    return Buffer.from(base64, 'base64');
  }
}
