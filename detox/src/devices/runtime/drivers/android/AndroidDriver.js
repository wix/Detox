// @ts-nocheck
const path = require('path');
const URL = require('url').URL;

const fs = require('fs-extra');
const _ = require('lodash');

const DetoxApi = require('../../../../android/espressoapi/Detox');
const EspressoDetoxApi = require('../../../../android/espressoapi/EspressoDetox');
const temporaryPath = require('../../../../artifacts/utils/temporaryPath');
const DetoxRuntimeError = require('../../../../errors/DetoxRuntimeError');
const getAbsoluteBinaryPath = require('../../../../utils/getAbsoluteBinaryPath');
const logger = require('../../../../utils/logger');
const { forEachSeries } = require('../../../../utils/p-iteration');
const pressAnyKey = require('../../../../utils/pressAnyKey');
const retry = require('../../../../utils/retry');
const sleep = require('../../../../utils/sleep');
const apkUtils = require('../../../common/drivers/android/tools/apk');
const DeviceDriverBase = require('../DeviceDriverBase');

const log = logger.child({ __filename });

/**
 * @typedef { TestApp } AndroidApp
 * @property uiDevice { UiDeviceProxy }
 * @property instrumentation { MonitoredInstrumentation }
 */

/**
 * @typedef AndroidDriverProps
 * @property adbName { String } The unique identifier associated with ADB
 */

/**
 * @typedef { DeviceDriverDeps } AndroidDriverDeps
 * @property uiDevice { UiDevice } The *general-purpose* (non-app-bound) UIDevice
 * @property instrumentation { MonitoredInstrumentation } The *general-purpose* (non-app-bound) instrumentation
 * @property adb { ADB }
 * @property aapt { AAPT }
 * @property apkValidator { ApkValidator }
 * @property fileXfer { FileXfer }
 * @property appInstallHelper { AppInstallHelper }
 * @property appUninstallHelper { AppUninstallHelper }
 * @property devicePathBuilder { AndroidDevicePathBuilder }
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
    this.fileXfer = deps.fileXfer;
    this.appInstallHelper = deps.appInstallHelper;
    this.appUninstallHelper = deps.appUninstallHelper;
    this.devicePathBuilder = deps.devicePathBuilder;

    this._unspecifiedApp.uiDevice = deps.uiDevice;
    this._unspecifiedApp.instrumentation = deps.instrumentation;
  }

  getExternalId() {
    return this.adbName;
  }

  getUiDevice() {
    return this._selectedApp.uiDevice;
  }

  /** @override */
  async _installApp(app) {
    const appConfig = app.config;
    const {
      appBinaryPath,
      testBinaryPath,
    } = this._getAppInstallPaths(appConfig.binaryPath, appConfig.testBinaryPath);
    await this._validateAppBinaries(appBinaryPath, testBinaryPath);
    await this._installAppBinaries(appBinaryPath, testBinaryPath);
  }

  /** @override */
  async _uninstallApp(app) {
    const { appId } = app;
    await this.emitter.emit('beforeUninstallApp', { deviceId: this.adbName, bundleId: appId });
    await this.appUninstallHelper.uninstall(this.adbName, appId);
  }

  async installUtilBinaries(paths) {
    for (const path of paths) {
      const packageId = await this._inferPackageIdFromApk(path);
      if (!await this.adb.isPackageInstalled(this.adbName, packageId)) {
        await this.appInstallHelper.install(this.adbName, path);
      }
    }
  }

  /**
   * @override
   */
  async _launchApp(app, launchArgs, languageAndLocale) {
    return await this.__handleLaunchApp({
      manually: false,
      app,
      launchArgs,
      languageAndLocale,
    });
  }

  /**
   * @override
   */
  async _waitForAppLaunch(app, launchArgs, languageAndLocale) {
    return await this.__handleLaunchApp({
      manually: true,
      app,
      launchArgs,
      languageAndLocale,
    });
  }

  /**
   * @private
   */
  async __handleLaunchApp({ manually, app, launchArgs }) {
    const { appId } = app;
    const { adbName } = this;

    await this.emitter.emit('beforeLaunchApp', { deviceId: adbName, bundleId: appId, launchArgs });

    launchArgs = await this._modifyArgsForNotificationHandling(adbName, appId, launchArgs);

    if (manually) {
      await this.__waitForAppLaunch(adbName, app, launchArgs);
    } else {
      await this.__launchApp(adbName, app, launchArgs);
    }

    const pid = await this._waitForProcess(adbName, appId);
    if (manually) {
      log.info({}, `Found the app (${appId}) with process ID = ${pid}. Proceeding...`);
    }

    await this.emitter.emit('launchApp', { deviceId: adbName, bundleId: appId, launchArgs, pid });
    return pid;
  }

  async __launchApp(adbName, app, launchArgs) {
    if (!app.instrumentation.isRunning()) {
      await this._launchInstrumentationProcess(adbName, app, launchArgs);
      await sleep(500);
    } else if (launchArgs.detoxURLOverride) {
      await this._startActivityWithUrl(launchArgs.detoxURLOverride);
    } else if (launchArgs.detoxUserNotificationDataURL) {
      await this._startActivityFromNotification(launchArgs.detoxUserNotificationDataURL);
    } else {
      await this._resumeMainActivity();
    }
  }

  async __waitForAppLaunch(adbName, app, launchArgs) {
    const instrumentationClass = await this.adb.getInstrumentationRunner(adbName, app.appId);
    this._printInstrumentationHint({ instrumentationClass, launchArgs });
    await pressAnyKey();
    await this._reverseServerPort(adbName);
  }

  async deliverPayload(params) {
    if (params.delayPayload) {
      return;
    }

    const { url, detoxUserNotificationDataURL } = params;
    if (url) {
      await this._startActivityWithUrl(url);
    } else if (detoxUserNotificationDataURL) {
      const payloadPathOnDevice = await this._sendNotificationDataToDevice(detoxUserNotificationDataURL, this.adbName);
      await this._startActivityFromNotification(payloadPathOnDevice);
    }
  }

  async _waitUntilReady(app) {
      try {
        await Promise.race([super._waitUntilReady(app), app.instrumentation.waitForCrash()]);
      } finally {
        app.instrumentation.abortWaitForCrash();
      }
  }

  async pressBack() {
    await this.getUiDevice().pressBack();
  }

  async sendToHome() {
    await this.getUiDevice().pressHome();
  }

  async typeText(text) {
    await this.adb.typeText(this.adbName, text);
  }

  /**
   * @override
   */
  async _terminate(app) {
    const { adbName } = this;
    const { appId } = app;
    await this.emitter.emit('beforeTerminateApp', { deviceId: adbName, bundleId: appId });
    await this._terminateInstrumentation(app);
    await this.adb.terminate(adbName, appId);
    await this.emitter.emit('terminateApp', { deviceId: adbName, bundleId: appId });
  }

  async cleanup() {
    await this._terminateAllInstrumentations();
    await super.cleanup();
  }

  getPlatform() {
    return 'android';
  }

  async reverseTcpPort(port) {
    await this.adb.reverse(this.adbName, port);
  }

  async unreverseTcpPort(port) {
    await this.adb.reverseRemove(this.adbName, port);
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
    const { adbName } = this;

    const pathOnDevice = this.devicePathBuilder.buildTemporaryArtifactPath('.png');
    await this.adb.screencap(adbName, pathOnDevice);

    const tempPath = temporaryPath.for.png();
    await this.adb.pull(adbName, pathOnDevice, tempPath);
    await this.adb.rm(adbName, pathOnDevice);

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
    await this.adb.install(this.adbName, appBinaryPath);
    await this.adb.install(this.adbName, testBinaryPath);
  }

  async _inferAppId(app) {
    return this._inferPackageIdFromApk(app.config.binaryPath);
  }

  async _inferPackageIdFromApk(apkPath) {
    const binaryPath = getAbsoluteBinaryPath(apkPath);
    return await this.aapt.getPackageName(binaryPath);
  }

  _getTestApkPath(originalApkPath) {
    const testApkPath = apkUtils.getTestApkPath(originalApkPath);

    if (!fs.existsSync(testApkPath)) {
      throw new DetoxRuntimeError({
        message: `The test APK could not be found at path: '${testApkPath}'`,
        hint: 'Try running the detox build command, and make sure it was configured to execute a build command (e.g. \'./gradlew assembleAndroidTest\')' +
          '\nFor further assistance, visit the Android setup guide: https://github.com/wix/Detox/blob/master/docs/Introduction.Android.md',
      });
    }
    return testApkPath;
  }

  async _modifyArgsForNotificationHandling(adbName, appId, launchArgs) {
    let _launchArgs = launchArgs;
    if (launchArgs.detoxUserNotificationDataURL) {
      const notificationPayloadTargetPath = await this._sendNotificationDataToDevice(launchArgs.detoxUserNotificationDataURL, adbName);
      _launchArgs = {
        ...launchArgs,
        detoxUserNotificationDataURL: notificationPayloadTargetPath,
      };
    }
    return _launchArgs;
  }

  async _launchInstrumentationProcess(adbName, app, userLaunchArgs) {
    const serverPort = await this._reverseServerPort(adbName);
    app.instrumentation.setTerminationFn(async () => {
      await this._terminateInstrumentation(app);
      await this.adb.reverseRemove(adbName, serverPort);
    });
    await app.instrumentation.launch(adbName, app.appId, userLaunchArgs);
  }

  async _reverseServerPort(adbName) {
    const serverPort = new URL(this.client.serverUrl).port;
    await this.adb.reverse(adbName, serverPort);
    return serverPort;
  }

  async _terminateAllInstrumentations() {
    return forEachSeries(
      this._allAppsList(),
      this._terminateInstrumentation,
      this);
  }

  async _terminateInstrumentation(app) {
    await app.instrumentation.terminate();
    await app.instrumentation.setTerminationFn(null);
  }

  async _sendNotificationDataToDevice(dataFileLocalPath, adbName) {
    await this.fileXfer.prepareDestinationDir(adbName);
    return await this.fileXfer.send(adbName, dataFileLocalPath, 'notification.json');
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

  async _waitForProcess(adbName, appId) {
    let pid = NaN;
    try {
      const queryPid = () => this._queryPID(adbName, appId);
      const retryQueryPid = () => retry({ backoff: 'none', retries: 4 }, queryPid);
      const retryQueryPidMultiple = () => retry({ backoff: 'linear' }, retryQueryPid);
      pid = await retryQueryPidMultiple();
    } catch (e) {
      log.warn(await this.adb.shell(adbName, 'ps'));
      throw e;
    }
    return pid;
  }

  async _queryPID(adbName, appId) {
    const pid = await this.adb.pidof(adbName, appId);
    if (!pid) {
      throw new DetoxRuntimeError('PID still not available');
    }
    return pid;
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
