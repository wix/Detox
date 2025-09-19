/* eslint @typescript-eslint/no-unused-vars: ["error", { "args": "none" }] */
// @ts-nocheck
const path = require('path');
const URL = require('url').URL;

const fs = require('fs-extra');
const _ = require('lodash');

const DetoxApi = require('../../../../android/espressoapi/Detox');
const EspressoDetoxApi = require('../../../../android/espressoapi/EspressoDetox');
const UiDeviceProxy = require('../../../../android/espressoapi/UiDeviceProxy');
const temporaryPath = require('../../../../artifacts/utils/temporaryPath');
const DetoxRuntimeError = require('../../../../errors/DetoxRuntimeError');
const getAbsoluteBinaryPath = require('../../../../utils/getAbsoluteBinaryPath');
const logger = require('../../../../utils/logger');
const pressAnyKey = require('../../../../utils/pressAnyKey');
const retry = require('../../../../utils/retry');
const sleep = require('../../../../utils/sleep');
const apkUtils = require('../../../common/drivers/android/tools/apk');
const DeviceDriverBase = require('../DeviceDriverBase');

const log = logger.child({ cat: 'device' });

/**
 * @typedef AndroidDriverProps
 * @property adbName { String } The unique identifier associated with ADB
 */

/**
 * @typedef { DeviceDriverDeps } AndroidDriverDeps
 * @property invocationManager { InvocationManager }
 * @property adb { ADB }
 * @property aapt { AAPT }
 * @property apkValidator { ApkValidator }
 * @property fileTransfer { FileTransfer }
 * @property appInstallHelper { AppInstallHelper }
 * @property appUninstallHelper { AppUninstallHelper }
 * @property devicePathBuilder { AndroidDevicePathBuilder }
 * @property instrumentation { MonitoredInstrumentation }
 */

class AndroidDriver extends DeviceDriverBase {
  /**
   * @param deps { AndroidDriverDeps }
   * @param props { AndroidDriverProps }
   */
  constructor(deps, { adbName }) {
    super(deps);

    this.adbName = adbName;
    this.adb = deps.adb;
    this.aapt = deps.aapt;
    this.apkValidator = deps.apkValidator;
    this.invocationManager = deps.invocationManager;
    this.fileTransfer = deps.fileTransfer;
    this.appInstallHelper = deps.appInstallHelper;
    this.appUninstallHelper = deps.appUninstallHelper;
    this.devicePathBuilder = deps.devicePathBuilder;
    this.instrumentation = deps.instrumentation;

    this.uiDevice = new UiDeviceProxy(this.invocationManager).getUIDevice();
  }

  getExternalId() {
    return this.adbName;
  }

  async getBundleIdFromBinary(apkPath) {
    const binaryPath = getAbsoluteBinaryPath(apkPath);
    return await this.aapt.getPackageName(binaryPath);
  }

  async installApp(_appBinaryPath, _testBinaryPath) {
    const {
      appBinaryPath,
      testBinaryPath,
    } = this._getAppInstallPaths(_appBinaryPath, _testBinaryPath);
    await this._validateAppBinaries(appBinaryPath, testBinaryPath);
    await this._installAppBinaries(appBinaryPath, testBinaryPath);
  }

  async uninstallApp(bundleId) {
    await this.emitter.emit('beforeUninstallApp', { deviceId: this.adbName, bundleId });
    await this.appUninstallHelper.uninstall(bundleId);
  }

  async installUtilBinaries(paths) {
    for (const path of paths) {
      const packageId = await this.getBundleIdFromBinary(path);
      if (!await this.adb.isPackageInstalled(packageId)) {
        await this.appInstallHelper.install(path);
      }
    }
  }

  async launchApp(bundleId, launchArgs, languageAndLocale) {
    return await this._handleLaunchApp({
      manually: false,
      bundleId,
      launchArgs,
      languageAndLocale,
    });
  }

  async waitForAppLaunch(bundleId, launchArgs, languageAndLocale) {
    return await this._handleLaunchApp({
      manually: true,
      bundleId,
      launchArgs,
      languageAndLocale,
    });
  }

  async _handleLaunchApp({ manually, bundleId, launchArgs }) {
    await this.emitter.emit('beforeLaunchApp', { deviceId: this.adbName, bundleId, launchArgs });

    launchArgs = await this._modifyArgsForNotificationHandling(bundleId, launchArgs);

    if (manually) {
      await this._waitForAppLaunch(bundleId, launchArgs);
    } else {
      await this._launchApp(bundleId, launchArgs);
    }

    const pid = await this._waitForProcess(bundleId);
    if (manually) {
      log.info({}, `Found the app (${bundleId}) with process ID = ${pid}. Proceeding...`);
    }

    await this.emitter.emit('launchApp', { deviceId: this.adbName, bundleId, launchArgs, pid });
    return pid;
  }

  async deliverPayload(params) {
    if (params.delayPayload) {
      return;
    }

    const { url, detoxUserNotificationDataURL } = params;
    if (url) {
      await this._startActivityWithUrl(url);
    } else if (detoxUserNotificationDataURL) {
      const payloadPathOnDevice = await this._sendNotificationDataToDevice(detoxUserNotificationDataURL);
      await this._startActivityFromNotification(payloadPathOnDevice);
    }
  }

  async waitUntilReady() {
      try {
        await Promise.race([
          super.waitUntilReady(),
          this.instrumentation.waitForCrash()
        ]);
      } catch (e) {
        log.warn({ error: e }, 'An error occurred while waiting for the app to become ready. Waiting for disconnection...');
        await this.client.waitUntilDisconnected();
        log.warn('The app disconnected.');
        throw e;
      } finally {
        this.instrumentation.abortWaitForCrash();
      }
  }

  async pressBack() {
    await this.uiDevice.pressBack();
  }

  async sendToHome(params) {
    await this.uiDevice.pressHome();
  }

  async typeText(text) {
    await this.adb.typeText(text);
  }

  async terminate(bundleId) {
    await this.emitter.emit('beforeTerminateApp', { deviceId: this.adbName, bundleId });
    await this._terminateInstrumentation();
    await this.adb.terminate(bundleId);
    await this.emitter.emit('terminateApp', { deviceId: this.adbName, bundleId });
  }

  async cleanup(bundleId) {
    await this._terminateInstrumentation();
    await super.cleanup(bundleId);
  }

  getPlatform() {
    return 'android';
  }

  getUiDevice() {
    return this.uiDevice;
  }

  async reverseTcpPort(port) {
    await this.adb.reverse(port);
  }

  async unreverseTcpPort(port) {
    await this.adb.reverseRemove(port);
  }

  async setURLBlacklist(urlList) {
    await this.invocationManager.execute(EspressoDetoxApi.setURLBlacklist(urlList));
  }

  async enableSynchronization() {
    await this.invocationManager.execute(EspressoDetoxApi.setSynchronization(true));
  }

  async disableSynchronization() {
    await this.invocationManager.execute(EspressoDetoxApi.setSynchronization(false));
  }

  async takeScreenshot(screenshotName) {
    const pathOnDevice = this.devicePathBuilder.buildTemporaryArtifactPath('.png');
    await this.adb.screencap(pathOnDevice);

    const tempPath = temporaryPath.for.png();
    await this.adb.pull(pathOnDevice, tempPath);
    await this.adb.rm(pathOnDevice);

    await this.emitter.emit('createExternalArtifact', {
      pluginId: 'screenshot',
      artifactName: screenshotName || path.basename(tempPath, '.png'),
      artifactPath: tempPath,
    });

    return tempPath;
  }

  async setOrientation(orientation) {
    const orientationMapping = {
      landscape: 1, // top at left side landscape
      portrait: 0 // non-reversed portrait.
    };

    const call = EspressoDetoxApi.changeOrientation(orientationMapping[orientation]);
    await this.invocationManager.execute(call);
  }

  async tap(point, shouldIgnoreStatusBar) {
    let x = point?.x ?? 100;
    let y = point?.y ?? 100;
    let _shouldIgnoreStatusBar = shouldIgnoreStatusBar ?? true;
    const call = EspressoDetoxApi.tap(x, y, _shouldIgnoreStatusBar);
    await this.invocationManager.execute(call);
  }

  async longPress(point, duration, shouldIgnoreStatusBar) {
    let x = point?.x ?? 100;
    let y = point?.y ?? 100;
    let _shouldIgnoreStatusBar = shouldIgnoreStatusBar ?? true;
    const call = duration ? EspressoDetoxApi.longPress(x, y, duration, _shouldIgnoreStatusBar): EspressoDetoxApi.longPress(x, y, _shouldIgnoreStatusBar);
    await this.invocationManager.execute(call);
  }

  async generateViewHierarchyXml(shouldInjectTestIds) {
    const hierarchy = await this.invocationManager.execute(DetoxApi.generateViewHierarchyXml(shouldInjectTestIds));
    return hierarchy.result;
  }

  _getAppInstallPaths(_appBinaryPath, _testBinaryPath) {
    const appBinaryPath = getAbsoluteBinaryPath(_appBinaryPath);
    const testBinaryPath = _testBinaryPath ? getAbsoluteBinaryPath(_testBinaryPath) : this._getTestApkPath(appBinaryPath);
    return {
      appBinaryPath,
      testBinaryPath,
    };
  }

  async _validateAppBinaries(appBinaryPath, testBinaryPath) {
    try {
      await this.apkValidator.validateAppApk(appBinaryPath);
    } catch (e) {
      logger.warn(e.toString());
    }

    try {
      await this.apkValidator.validateTestApk(testBinaryPath);
    } catch (e) {
      logger.warn(e.toString());
    }
  }

  async _installAppBinaries(appBinaryPath, testBinaryPath) {
    await this.adb.install(appBinaryPath);
    await this.adb.install(testBinaryPath);
  }

  _getTestApkPath(originalApkPath) {
    const testApkPath = apkUtils.getTestApkPath(originalApkPath);

    if (!fs.existsSync(testApkPath)) {
      throw new DetoxRuntimeError({
        message: `The test APK could not be found at path: '${testApkPath}'`,
        hint: 'Try running the detox build command, and make sure it was configured to execute a build command (e.g. \'./gradlew assembleAndroidTest\')' +
          '\nFor further assistance, visit the project setup guide (select the Android tabs): https://wix.github.io/Detox/docs/introduction/project-setup',
      });
    }
    return testApkPath;
  }

  async _modifyArgsForNotificationHandling(bundleId, launchArgs) {
    let _launchArgs = launchArgs;
    if (launchArgs.detoxUserNotificationDataURL) {
      const notificationPayloadTargetPath = await this._sendNotificationDataToDevice(launchArgs.detoxUserNotificationDataURL);
      _launchArgs = {
        ...launchArgs,
        detoxUserNotificationDataURL: notificationPayloadTargetPath,
      };
    }
    return _launchArgs;
  }

  async _launchApp(bundleId, launchArgs) {
    if (!this.instrumentation.isRunning()) {
      await this._launchInstrumentationProcess(bundleId, launchArgs);
      await sleep(500);
    } else if (launchArgs.detoxURLOverride) {
      await this._startActivityWithUrl(launchArgs.detoxURLOverride);
    } else if (launchArgs.detoxUserNotificationDataURL) {
      await this._startActivityFromNotification(launchArgs.detoxUserNotificationDataURL);
    } else {
      await this._resumeMainActivity();
    }
  }

  async _launchInstrumentationProcess(bundleId, userLaunchArgs) {
    const serverPort = await this._reverseServerPort();
    this.instrumentation.setTerminationFn(async () => {
      await this.adb.reverseRemove(serverPort);
    });
    await this.instrumentation.launch(this.adbName, bundleId, userLaunchArgs);
  }

  async _reverseServerPort() {
    const serverPort = new URL(this.client.serverUrl).port;
    await this.adb.reverse(serverPort);
    return serverPort;
  }

  async _terminateInstrumentation() {
    await this.instrumentation.terminate();
    await this.instrumentation.setTerminationFn(null);
  }

  async _sendNotificationDataToDevice(dataFileLocalPath) {
    await this.fileTransfer.prepareDestinationDir();
    return await this.fileTransfer.send(dataFileLocalPath, 'notification.json');
  }

  _startActivityWithUrl(url) {
    return this.invocationManager.execute(DetoxApi.startActivityFromUrl(url));
  }

  _startActivityFromNotification(dataFilePath) {
    return this.invocationManager.execute(DetoxApi.startActivityFromNotification(dataFilePath));
  }

  _resumeMainActivity() {
    return this.invocationManager.execute(DetoxApi.launchMainActivity());
  }

  async _waitForProcess(bundleId) {
    let pid = NaN;
    try {
      const queryPid = () => this._queryPID(bundleId);
      const retryQueryPid = () => retry({ backoff: 'none', retries: 4 }, queryPid);
      const retryQueryPidMultiple = () => retry({ backoff: 'linear' }, retryQueryPid);
      pid = await retryQueryPidMultiple();
    } catch (e) {
      log.warn(await this.adb.shell('ps'));
      throw e;
    }
    return pid;
  }

  async _queryPID(bundleId) {
    const pid = await this.adb.pidof(bundleId);
    if (!pid) {
      throw new DetoxRuntimeError('PID still not available');
    }
    return pid;
  }

  async _waitForAppLaunch(bundleId, launchArgs) {
    const instrumentationClass = await this.adb.getInstrumentationRunner(bundleId);
    this._printInstrumentationHint({ instrumentationClass, launchArgs });
    await pressAnyKey();
    await this._reverseServerPort();
  }

  _printInstrumentationHint({ instrumentationClass, launchArgs }) {
    const keyMaxLength = Math.max(3, _(launchArgs).keys().maxBy('length').length);
    const valueMaxLength = Math.max(5, _(launchArgs).values().map(String).maxBy('length').length);
    const rows = _.map(launchArgs, (v, k) => {
      const paddedKey = k.padEnd(keyMaxLength, ' ');
      const paddedValue = `${v}`.padEnd(valueMaxLength, ' ');
      return `${paddedKey} | ${paddedValue}`;
    });

    const keyHeader = 'Key'.padEnd(keyMaxLength, ' ');
    const valueHeader = 'Value'.padEnd(valueMaxLength, ' ');
    const header = `${keyHeader} | ${valueHeader}`;
    const separator = '-'.repeat(header.length);

    log.info({},
      'Waiting for you to manually launch your app in Android Studio.\n\n' +
      `Instrumentation class: ${instrumentationClass}\n` +
      'Instrumentation arguments:\n' +
      `${separator}\n` +
      `${header}\n` +
      `${separator}\n` +
      `${rows.join('\n')}\n` +
      `${separator}\n\n` +
      'Press any key to continue...'
    );
  }
}

module.exports = AndroidDriver;
