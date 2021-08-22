const path = require('path');
const URL = require('url').URL;

const fs = require('fs-extra');
const _ = require('lodash');

const DetoxApi = require('../../../../android/espressoapi/Detox');
const EspressoDetoxApi = require('../../../../android/espressoapi/EspressoDetox');
const UiDeviceProxy = require('../../../../android/espressoapi/UiDeviceProxy');
const AndroidInstrumentsPlugin = require('../../../../artifacts/instruments/android/AndroidInstrumentsPlugin');
const ADBLogcatPlugin = require('../../../../artifacts/log/android/ADBLogcatPlugin');
const ADBScreencapPlugin = require('../../../../artifacts/screenshot/ADBScreencapPlugin');
const TimelineArtifactPlugin = require('../../../../artifacts/timeline/TimelineArtifactPlugin');
const AndroidDevicePathBuilder = require('../../../../artifacts/utils/AndroidDevicePathBuilder');
const temporaryPath = require('../../../../artifacts/utils/temporaryPath');
const ADBScreenrecorderPlugin = require('../../../../artifacts/video/ADBScreenrecorderPlugin');
const DetoxRuntimeError = require('../../../../errors/DetoxRuntimeError');
const getAbsoluteBinaryPath = require('../../../../utils/getAbsoluteBinaryPath');
const logger = require('../../../../utils/logger');
const pressAnyKey = require('../../../../utils/pressAnyKey');
const retry = require('../../../../utils/retry');
const sleep = require('../../../../utils/sleep');
const DeviceDriverBase = require('../DeviceDriverBase');

const AAPT = require('../../../common/drivers/android/exec/AAPT');
const ADB = require('../../../common/drivers/android/exec/ADB');
const APKPath = require('../../../common/drivers/android/tools/APKPath');
const AppInstallHelper = require('../../../common/drivers/android/tools/AppInstallHelper');
const AppUninstallHelper = require('../../../common/drivers/android/tools/AppUninstallHelper');
const MonitoredInstrumentation = require('../../../common/drivers/android/tools/MonitoredInstrumentation');
const TempFileXfer = require('../../../common/drivers/android/tools/TempFileXfer');

const log = logger.child({ __filename });

class AndroidDriver extends DeviceDriverBase {
  /**
   * @param adbName { String }
   * @param config { Object }
   */
  constructor(adbName, config) {
    super(config);

    this.adbName = adbName;

    this.invocationManager = config.invocationManager;
    this.uiDevice = new UiDeviceProxy(this.invocationManager).getUIDevice();

    // TODO ASDASD Move this to factory
    this.adb = new ADB();
    this.aapt = new AAPT();
    this.fileXfer = new TempFileXfer(this.adb);
    this.appInstallHelper = new AppInstallHelper(this.adb, this.fileXfer);
    this.appUninstallHelper = new AppUninstallHelper(this.adb);
    this.devicePathBuilder = new AndroidDevicePathBuilder();

    this.instrumentation = new MonitoredInstrumentation(this.adb, logger);
  }

  getExternalId() {
    return this.adbName;
  }

  declareArtifactPlugins() {
    const { adb, client, devicePathBuilder } = this;

    return {
      instruments: (api) => new AndroidInstrumentsPlugin({ api, adb, client, devicePathBuilder }),
      log: (api) => new ADBLogcatPlugin({ api, adb, devicePathBuilder }),
      screenshot: (api) => new ADBScreencapPlugin({ api, adb, devicePathBuilder }),
      video: (api) => new ADBScreenrecorderPlugin({ api, adb, devicePathBuilder }),
      timeline: (api) => new TimelineArtifactPlugin({ api }),
    };
  }

  async getBundleIdFromBinary(apkPath) {
    const binaryPath = getAbsoluteBinaryPath(apkPath);
    return await this.aapt.getPackageName(binaryPath);
  }

  async installApp(_binaryPath, _testBinaryPath) {
    const {
      binaryPath,
      testBinaryPath,
    } = this._getInstallPaths(_binaryPath, _testBinaryPath);
    await this.adb.install(this.adbName, binaryPath);
    await this.adb.install(this.adbName, testBinaryPath);
  }

  async uninstallApp(bundleId) {
    await this.emitter.emit('beforeUninstallApp', { deviceId: this.adbName, bundleId });
    await this.appUninstallHelper.uninstall(this.adbName, bundleId);
  }

  async installUtilBinaries(paths) {
    for (const path of paths) {
      const packageId = await this.getBundleIdFromBinary(path);
      if (!await this.adb.isPackageInstalled(this.adbName, packageId)) {
        await this.appInstallHelper.install(this.adbName, path);
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
    const { adbName } = this;

    await this.emitter.emit('beforeLaunchApp', { deviceId: adbName, bundleId, launchArgs });

    launchArgs = await this._modifyArgsForNotificationHandling(adbName, bundleId, launchArgs);

    if (manually) {
      await this._waitForAppLaunch(adbName, bundleId, launchArgs);
    } else {
      await this._launchApp(adbName, bundleId, launchArgs);
    }

    const pid = await this._waitForProcess(adbName, bundleId);
    if (manually) {
      log.info({}, `Found the app (${bundleId}) with process ID = ${pid}. Proceeding...`);
    }

    await this.emitter.emit('launchApp', { deviceId: adbName, bundleId, launchArgs, pid });
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
      const payloadPathOnDevice = await this._sendNotificationDataToDevice(detoxUserNotificationDataURL, this.adbName);
      await this._startActivityFromNotification(payloadPathOnDevice);
    }
  }

  async waitUntilReady() {
      try {
        await Promise.race([super.waitUntilReady(), this.instrumentation.waitForCrash()]);
      } finally {
        this.instrumentation.abortWaitForCrash();
      }
  }

  async pressBack() { // eslint-disable-line no-unused-vars
    await this.uiDevice.pressBack();
  }

  async sendToHome(params) { // eslint-disable-line no-unused-vars
    await this.uiDevice.pressHome();
  }

  async typeText(text) {
    await this.adb.typeText(this.adbName, text);
  }

  async terminate(bundleId) {
    const { adbName } = this;
    await this.emitter.emit('beforeTerminateApp', { deviceId: adbName, bundleId });
    await this._terminateInstrumentation();
    await this.adb.terminate(adbName, bundleId);
    await this.emitter.emit('terminateApp', { deviceId: adbName, bundleId });
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

  _getInstallPaths(_binaryPath, _testBinaryPath) {
    const binaryPath = getAbsoluteBinaryPath(_binaryPath);
    const testBinaryPath = _testBinaryPath ? getAbsoluteBinaryPath(_testBinaryPath) : this._getTestApkPath(binaryPath);
    return {
      binaryPath,
      testBinaryPath,
    };
  }

  _getTestApkPath(originalApkPath) {
    const testApkPath = APKPath.getTestApkPath(originalApkPath);

    if (!fs.existsSync(testApkPath)) {
      throw new DetoxRuntimeError(`'${testApkPath}' could not be found, did you run './gradlew assembleAndroidTest'?`);
    }
    return testApkPath;
  }

  async _modifyArgsForNotificationHandling(adbName, bundleId, launchArgs) {
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

  async _launchApp(adbName, bundleId, launchArgs) {
    if (!this.instrumentation.isRunning()) {
      await this._launchInstrumentationProcess(adbName, bundleId, launchArgs);
      await sleep(500);
    } else if (launchArgs.detoxURLOverride) {
      await this._startActivityWithUrl(launchArgs.detoxURLOverride);
    } else if (launchArgs.detoxUserNotificationDataURL) {
      await this._startActivityFromNotification(launchArgs.detoxUserNotificationDataURL);
    } else {
      await this._resumeMainActivity();
    }
  }

  async _launchInstrumentationProcess(adbName, bundleId, userLaunchArgs) {
    const serverPort = await this._reverseServerPort(adbName);
    this.instrumentation.setTerminationFn(async () => {
      await this._terminateInstrumentation();
      await this.adb.reverseRemove(adbName, serverPort);
    });
    await this.instrumentation.launch(adbName, bundleId, userLaunchArgs);
  }

  async _reverseServerPort(adbName) {
    const serverPort = new URL(this.client.serverUrl).port;
    await this.adb.reverse(adbName, serverPort);
    return serverPort;
  }

  async _terminateInstrumentation() {
    await this.instrumentation.terminate();
    await this.instrumentation.setTerminationFn(null);
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

  async _waitForProcess(adbName, bundleId) {
    let pid = NaN;
    try {
      const queryPid = () => this._queryPID(adbName, bundleId);
      const retryQueryPid = () => retry({ backoff: 'none', retries: 4 }, queryPid);
      const retryQueryPidMultiple = () => retry({ backoff: 'linear' }, retryQueryPid);
      pid = await retryQueryPidMultiple();
    } catch (e) {
      log.warn(await this.adb.shell(adbName, 'ps'));
      throw e;
    }
    return pid;
  }

  async _queryPID(adbName, bundleId) {
    const pid = await this.adb.pidof(adbName, bundleId);
    if (!pid) {
      throw new DetoxRuntimeError('PID still not available');
    }
    return pid;
  }

  async _waitForAppLaunch(adbName, bundleId, launchArgs) {
    const instrumentationClass = await this.adb.getInstrumentationRunner(adbName, bundleId);
    this._printInstrumentationHint({ instrumentationClass, launchArgs });
    await pressAnyKey();
    await this._reverseServerPort(adbName);
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
