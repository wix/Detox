// @ts-nocheck
const path = require('path');
const { URL } = require('url');

const fs = require('fs-extra');
const _ = require('lodash');

const DetoxApi = require('../../../../android/espressoapi/Detox');
const EspressoDetoxApi = require('../../../../android/espressoapi/EspressoDetox');
const temporaryPath = require('../../../../artifacts/utils/temporaryPath');
const DetoxRuntimeError = require('../../../../errors/DetoxRuntimeError');
const getAbsoluteBinaryPath = require('../../../../utils/getAbsoluteBinaryPath');
const logger = require('../../../../utils/logger');
const pressAnyKey = require('../../../../utils/pressAnyKey');
const retry = require('../../../../utils/retry');
const sleep = require('../../../../utils/sleep');
const apkUtils = require('../../../common/drivers/android/tools/apk');
const { DeviceDriver, TestAppDriver } = require('../BaseDrivers');

const log = logger.child({ __filename });

/**
 * @typedef { DeviceDriverDeps } AndroidDeviceDriverDeps
 * @property adb { ADB }
 * @property devicePathBuilder { AndroidDevicePathBuilder }
 */

class AndroidDeviceDriver extends DeviceDriver {
  /**
   * @param deps { AndroidDeviceDriverDeps }
   * @param props {{ adbName: String }}
   */
  constructor(deps, { adbName }) {
    super(deps);

    this.adbName = adbName;
    this.adb = deps.adb;
    this.devicePathBuilder = deps.devicePathBuilder;
  }

  /** @override */
  get platform() {
    return 'android';
  }

  /** @override */
  get externalId() {
    return this.adbName;
  }

  /** @override */
  async pressBack() {
    await this.uiDevice.pressBack();
  }

  /** @override */
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

  /** @override */
  async reverseTcpPort(port) {
    await this.adb.reverse(this.adbName, port);
  }

  /** @override */
  async unreverseTcpPort(port) {
    await this.adb.reverseRemove(this.adbName, port);
  }

  /** @override */
  async typeText(text) {
    await this.adb.typeText(this.adbName, text);
  }
}

/**
 * @typedef { AppInfo } AndroidAppInfo
 * @property testBinaryPath { String }
 */

/**
 * @typedef { TestAppDriverDeps } AndroidAppDriverDeps
 * @property adb { ADB }
 * @property aapt { AAPT }
 * @property apkValidator { ApkValidator }
 * @property fileXfer { FileXfer }
 * @property appInstallHelper { AppInstallHelper }
 * @property appUninstallHelper { AppUninstallHelper }
 * @property uiDevice { UiDeviceProxy }
 * @property instrumentation { MonitoredInstrumentation }
 */

class AndroidAppDriver extends TestAppDriver {
  /**
   * @param deps { AndroidAppDriverDeps }
   * @param props {{ adbName: String }}
   */
  constructor(deps, { adbName }) {
    super(deps);

    this.adb = deps.adb;
    this.aapt = deps.aapt;
    this.apkValidator = deps.apkValidator;
    this.fileXfer = deps.fileXfer;
    this.appInstallHelper = deps.appInstallHelper;
    this.appUninstallHelper = deps.appUninstallHelper;
    this._uiDevice = deps.uiDevice;
    this._instrumentation = deps.instrumentation;

    this.adbName = adbName;
    this._packageId = null;

    this._inferPackageIdFromApk = _.memoize(this._inferPackageIdFromApk.bind(this), (appInfo) => appInfo.binaryPath);
  }

  /** @override */
  get uiDevice() {
    return this._uiDevice;
  }

  /**
   * @override
   * @param appInfo { AndroidAppInfo }
   */
  async select(appInfo) {
    await super.select(appInfo);

    this._packageId = await this._inferPackageIdFromApk(appInfo.binaryPath);
  }

  /** @override */
  async launch(launchInfo) {
    this._pid = await this._handleLaunchApp({
      manually: false,
      launchArgs: launchInfo.launchArgs,
    });
    await this._waitUntilReady();
    await this._notifyAppReady(this.adbName, this._packageId);
  }

  /** @override */
  async waitForLaunch(launchInfo) {
    this._pid = await this._handleLaunchApp({
      manually: true,
      launchArgs: launchInfo.launchArgs,
    });
    await this._notifyAppReady(this.adbName, this._packageId);
  }

  /** @override */
  async reloadReactNative() {
    return this.client.reloadReactNative();
  }

  /** @override */
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

  /** @override */
  async terminate() {
    const { adbName, _packageId } = this;

    await this.emitter.emit('beforeTerminateApp', { deviceId: adbName, bundleId: _packageId });
    await this._terminateInstrumentation();
    await this.adb.terminate(adbName, _packageId);
    await this.emitter.emit('terminateApp', { deviceId: adbName, bundleId: _packageId });
    await super.terminate();
  }

  /** @override */
  async install() {
    const { _appInfo } = this;
    const {
      appBinaryPath,
      testBinaryPath,
    } = this._getAppInstallPaths(_appInfo.binaryPath, _appInfo.testBinaryPath);
    await this._validateAppBinaries(appBinaryPath, testBinaryPath);
    await this._installAppBinaries(appBinaryPath, testBinaryPath);
  }

  /** @override */
  async uninstall() {
    const { _packageId } = this;

    if (_packageId) {
      await this.emitter.emit('beforeUninstallApp', { deviceId: this.adbName, bundleId: _packageId });
      await this.appUninstallHelper.uninstall(this.adbName, _packageId);
    }
  }

  /** @override */
  async invoke(invocation) {
    const resultObj = await this.invocationManager.execute(invocation);
    return resultObj ? resultObj.result : undefined;
  }

  /** @override */
  async setOrientation(orientation) {
    const orientationMapping = {
      landscape: 1, // top at left side landscape
      portrait: 0 // non-reversed portrait.
    };

    const call = EspressoDetoxApi.changeOrientation(orientationMapping[orientation]);
    await this.invocationManager.execute(call);
  }

  /** @override */
  async setURLBlacklist(urlList) {
    await this.invoke(EspressoDetoxApi.setURLBlacklist(urlList));
  }

  /** @override */
  async enableSynchronization() {
    await this.invoke(EspressoDetoxApi.setSynchronization(true));
  }

  /** @override */
  async disableSynchronization() {
    await this.invoke(EspressoDetoxApi.setSynchronization(false));
  }

  /** @override */
  async sendToHome() {
    await this.uiDevice.pressHome();
  }

  /** @override */
  async pressBack() {
    await this.uiDevice.pressBack();
  }

  /** @override */
  async cleanup() {
    await this._terminateInstrumentation();
  }

  async _inferPackageIdFromApk(apkPath) {
    const binaryPath = getAbsoluteBinaryPath(apkPath);
    return await this.aapt.getPackageName(binaryPath);
  }

  async _handleLaunchApp({ manually, launchArgs }) {
    const { adbName, _packageId } = this;

    await this.emitter.emit('beforeLaunchApp', { deviceId: adbName, bundleId: _packageId, launchArgs });

    launchArgs = await this._applyAppSessionArgs(launchArgs);
    launchArgs = await this._modifyArgsForNotificationHandling(launchArgs);

    if (manually) {
      await this.__waitForAppLaunch(launchArgs);
    } else {
      await this.__launchApp(launchArgs);
    }

    const pid = await this._waitForProcess();
    if (manually) {
      log.info({}, `Found the app (${_packageId}) with process ID = ${pid}. Proceeding...`);
    }

    await this.emitter.emit('launchApp', { deviceId: adbName, bundleId: _packageId, launchArgs, pid });
    return pid;
  }

  async __launchApp(launchArgs) {
    if (!this._instrumentation.isRunning()) {
      await this._launchInstrumentationProcess(launchArgs);
      await sleep(500);
    } else if (launchArgs.detoxURLOverride) {
      await this._startActivityWithUrl(launchArgs.detoxURLOverride);
    } else if (launchArgs.detoxUserNotificationDataURL) {
      await this._startActivityFromNotification(launchArgs.detoxUserNotificationDataURL);
    } else {
      await this._resumeMainActivity();
    }
  }

  async __waitForAppLaunch(launchArgs) {
    const { adbName, _packageId } = this;

    const instrumentationClass = await this.adb.getInstrumentationRunner(adbName, _packageId);
    this._printInstrumentationHint({ instrumentationClass, launchArgs });
    await pressAnyKey();
    await this._reverseServerPort(adbName);
  }

  async _launchInstrumentationProcess(userLaunchArgs) {
    const { adbName, _packageId } = this;
    const serverPort = await this._reverseServerPort(adbName);
    this._instrumentation.setTerminationFn(async () => {
      await this._terminateInstrumentation();
      await this.adb.reverseRemove(adbName, serverPort);
    });
    await this._instrumentation.launch(adbName, _packageId, userLaunchArgs);
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

  _applyAppSessionArgs(launchArgs) {
    return {
      detoxServer: this.client.serverUrl,
      detoxSessionId: this.client.sessionId,
      ...launchArgs,
    };
  }

  async _modifyArgsForNotificationHandling(launchArgs) {
    if (launchArgs.detoxUserNotificationDataURL) {
      const notificationLocalFile = this._createPayloadFile(launchArgs.detoxUserNotificationDataURL);
      const notificationTargetPath = await this._sendNotificationDataToDevice(notificationLocalFile.path, this.adbName);
      notificationLocalFile.cleanup();

      return {
        ...launchArgs,
        detoxUserNotificationDataURL: notificationTargetPath,
      };
    }
    return launchArgs;
  }

  /** @override */
  async _waitUntilReady() {
    try {
      await Promise.race([super._waitUntilReady(), this._instrumentation.waitForCrash()]);
    } finally {
      this._instrumentation.abortWaitForCrash();
    }
  }

  /** @protected */
  async _sendNotificationDataToDevice(dataFileLocalPath, adbName) {
    await this.fileXfer.prepareDestinationDir(adbName);
    return await this.fileXfer.send(adbName, dataFileLocalPath, 'notification.json');
  }

  /** @protected */
  async _reverseServerPort(adbName) {
    const serverPort = new URL(this.client.serverUrl).port;
    await this.adb.reverse(adbName, serverPort);
    return serverPort;
  }

  /** @protected */
  _getAppInstallPaths(_appBinaryPath, _testBinaryPath) {
    const appBinaryPath = getAbsoluteBinaryPath(_appBinaryPath);
    const testBinaryPath = _testBinaryPath ? getAbsoluteBinaryPath(_testBinaryPath) : this._getTestApkPath(appBinaryPath);
    return {
      appBinaryPath,
      testBinaryPath,
    };
  }

  /** @protected */
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

  /** @protected */
  async _validateAppBinaries(appBinaryPath, testBinaryPath) {
    try {
      await this.apkValidator.validateAppApk(appBinaryPath);
    } catch (e) {
      log.warn(e.toString());
    }

    try {
      await this.apkValidator.validateTestApk(testBinaryPath);
    } catch (e) {
      log.warn(e.toString());
    }
  }

  /** @protected */
  async _installAppBinaries(appBinaryPath, testBinaryPath) {
    await this.adb.install(this.adbName, appBinaryPath);
    await this.adb.install(this.adbName, testBinaryPath);
  }

  /** @protected */
  async _waitForProcess() {
    const { adbName, _packageId } = this;
    let pid = NaN;
    try {
      const queryPid = () => this._queryPID(_packageId);
      const retryQueryPid = () => retry({ backoff: 'none', retries: 4 }, queryPid);
      const retryQueryPidMultiple = () => retry({ backoff: 'linear' }, retryQueryPid);
      pid = await retryQueryPidMultiple();
    } catch (e) {
      log.warn(await this.adb.shell(adbName, 'ps'));
      throw e;
    }
    return pid;
  }

  /** @protected */
  async _queryPID(appId) {
    const pid = await this.adb.pidof(this.adbName, appId);
    if (!pid) {
      throw new DetoxRuntimeError({ message: 'PID still not available' });
    }
    return pid;
  }

  /** @protected */
  async _terminateInstrumentation() {
    await this._instrumentation.terminate();
    await this._instrumentation.setTerminationFn(null);
  }

  /** @protected */
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

module.exports = {
  AndroidDeviceDriver,
  AndroidAppDriver,
};
