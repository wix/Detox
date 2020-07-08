const fs = require('fs');
const URL = require('url').URL;
const _ = require('lodash');
const DeviceDriverBase = require('../DeviceDriverBase');
const logger = require('../../../utils/logger');
const log = logger.child({ __filename });
const invoke = require('../../../invoke');
const InvocationManager = invoke.InvocationManager;
const ADB = require('./exec/ADB');
const AAPT = require('./exec/AAPT');
const APKPath = require('./tools/APKPath');
const TempFileXfer = require('./tools/TempFileXfer');
const AppInstallHelper = require('./tools/AppInstallHelper');
const AppUninstallHelper = require('./tools/AppUninstallHelper');
const MonitoredInstrumentation = require('./tools/MonitoredInstrumentation');
const DetoxApi = require('../../../android/espressoapi/Detox');
const EspressoDetoxApi = require('../../../android/espressoapi/EspressoDetox');
const UiDeviceProxy = require('../../../android/espressoapi/UiDeviceProxy');
const AndroidInstrumentsPlugin = require('../../../artifacts/instruments/android/AndroidInstrumentsPlugin');
const ADBLogcatPlugin = require('../../../artifacts/log/android/ADBLogcatPlugin');
const ADBScreencapPlugin = require('../../../artifacts/screenshot/ADBScreencapPlugin');
const ADBScreenrecorderPlugin = require('../../../artifacts/video/ADBScreenrecorderPlugin');
const AndroidDevicePathBuilder = require('../../../artifacts/utils/AndroidDevicePathBuilder');
const TimelineArtifactPlugin = require('../../../artifacts/timeline/TimelineArtifactPlugin');
const temporaryPath = require('../../../artifacts/utils/temporaryPath');
const sleep = require('../../../utils/sleep');
const retry = require('../../../utils/retry');
const getAbsoluteBinaryPath = require('../../../utils/getAbsoluteBinaryPath');
const AndroidExpect = require('../../../android/expect');

class AndroidDriver extends DeviceDriverBase {
  constructor(config) {
    super(config);

    this.invocationManager = new InvocationManager(this.client);
    this.matchers = new AndroidExpect(this.invocationManager);
    this.uiDevice = new UiDeviceProxy(this.invocationManager).getUIDevice();

    this.adb = new ADB();
    this.aapt = new AAPT();
    this.fileXfer = new TempFileXfer(this.adb);
    this.appInstallHelper = new AppInstallHelper(this.adb, this.fileXfer);
    this.appUninstallHelper = new AppUninstallHelper(this.adb);
    this.devicePathBuilder = new AndroidDevicePathBuilder();

    this.instrumentation = new MonitoredInstrumentation(this.adb, logger);
  }

  declareArtifactPlugins() {
    const { adb, client, devicePathBuilder } = this;

    return {
      instruments: (api) => new AndroidInstrumentsPlugin({ api, adb, client, devicePathBuilder }),
      log: (api) => new ADBLogcatPlugin({ api, adb, devicePathBuilder }),
      screenshot: (api) => new ADBScreencapPlugin({ api, adb, devicePathBuilder }),
      video: (api) => new ADBScreenrecorderPlugin({ api, adb, devicePathBuilder }),
      timeline: (api) => new TimelineArtifactPlugin({api, adb, devicePathBuilder}),
    };
  }

  async getBundleIdFromBinary(apkPath) {
    const binaryPath = getAbsoluteBinaryPath(apkPath);
    return await this.aapt.getPackageName(binaryPath);
  }

  async installApp(deviceId, _binaryPath, _testBinaryPath) {
    const {
      binaryPath,
      testBinaryPath,
    } = this._getInstallPaths(_binaryPath, _testBinaryPath);
    await this.adb.install(deviceId, binaryPath);
    await this.adb.install(deviceId, testBinaryPath);
  }

  async uninstallApp(deviceId, bundleId) {
    await this.emitter.emit('beforeUninstallApp', { deviceId, bundleId });
    await this.appUninstallHelper.uninstall(deviceId, bundleId);
  }

  async installUtilBinaries(deviceId, paths) {
    for (const path of paths) {
      const packageId = await this.getBundleIdFromBinary(path);
      if (!await this.adb.isPackageInstalled(deviceId, packageId)) {
        await this.appInstallHelper.install(deviceId, path);
      }
    }
  }

  async launchApp(deviceId, bundleId, launchArgs, languageAndLocale) {
    await this.emitter.emit('beforeLaunchApp', { deviceId, bundleId, launchArgs });

    launchArgs = await this._modifyArgsForNotificationHandling(deviceId, bundleId, launchArgs);
    await this._launchApp(deviceId, bundleId, launchArgs);

    const pid = await this._waitForProcess(deviceId, bundleId);
    await this.emitter.emit('launchApp', { deviceId, bundleId, launchArgs, pid });
    return pid;
  }

  async deliverPayload(params, deviceId) {
    if (params.delayPayload) {
      return;
    }

    const {url, detoxUserNotificationDataURL} = params;
    if (url) {
      await this._startActivityWithUrl(url);
    } else if (detoxUserNotificationDataURL) {
      const payloadPathOnDevice = await this._sendNotificationDataToDevice(detoxUserNotificationDataURL, deviceId);
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

  async pressBack(deviceId) {
    await this.uiDevice.pressBack();
  }

  async sendToHome(deviceId, params) {
    await this.uiDevice.pressHome();
  }

  async terminate(deviceId, bundleId) {
    await this.emitter.emit('beforeTerminateApp', { deviceId, bundleId });
    await this._terminateInstrumentation();
    await this.adb.terminate(deviceId, bundleId);
    await this.emitter.emit('terminateApp', { deviceId, bundleId });
  }

  async cleanup(deviceId, bundleId) {
    await this._terminateInstrumentation();
    await super.cleanup(deviceId, bundleId);
  }

  getPlatform() {
    return 'android';
  }

  getUiDevice() {
    return this.uiDevice;
  }

  async reverseTcpPort(deviceId, port) {
    await this.adb.reverse(deviceId, port);
  }

  async unreverseTcpPort(deviceId, port) {
    await this.adb.reverseRemove(deviceId, port);
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

  async takeScreenshot(deviceId, screenshotName) {
    const adb = this.adb;

    const pathOnDevice = this.devicePathBuilder.buildTemporaryArtifactPath('.png');
    await adb.screencap(deviceId, pathOnDevice);

    const tempPath = temporaryPath.for.png();
    await adb.pull(deviceId, pathOnDevice, tempPath);
    await adb.rm(deviceId, pathOnDevice);

    await this.emitter.emit('createExternalArtifact', {
      pluginId: 'screenshot',
      artifactName: screenshotName,
      artifactPath: tempPath,
    });

    return tempPath;
  }

  async setOrientation(deviceId, orientation) {
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
      throw new Error(`'${testApkPath}' could not be found, did you run './gradlew assembleAndroidTest'?`);
    }
    return testApkPath;
  }

  async _modifyArgsForNotificationHandling(deviceId, bundleId, launchArgs) {
    let _launchArgs = launchArgs;
    if (launchArgs.detoxUserNotificationDataURL) {
      const notificationPayloadTargetPath = await this._sendNotificationDataToDevice(launchArgs.detoxUserNotificationDataURL, deviceId);
      _launchArgs = {
        ...launchArgs,
        detoxUserNotificationDataURL: notificationPayloadTargetPath,
      }
    }
    return _launchArgs;
  }

  async _launchApp(deviceId, bundleId, launchArgs) {
    if (!this.instrumentation.isRunning()) {
      await this._launchInstrumentationProcess(deviceId, bundleId, launchArgs);
      await sleep(500);
    } else if (launchArgs.detoxURLOverride) {
      await this._startActivityWithUrl(launchArgs.detoxURLOverride);
    } else if (launchArgs.detoxUserNotificationDataURL) {
      await this._startActivityFromNotification(launchArgs.detoxUserNotificationDataURL);
    } else {
      await this._resumeMainActivity();
    }
  }

  async _launchInstrumentationProcess(deviceId, bundleId, userLaunchArgs) {
    const serverPort = new URL(this.client.configuration.server).port;
    await this.adb.reverse(deviceId, serverPort);

    this.instrumentation.setTerminationFn(async () => {
      await this._terminateInstrumentation();
      await this.adb.reverseRemove(deviceId, serverPort);
    });
    await this.instrumentation.launch(deviceId, bundleId, userLaunchArgs);
  }

  async _terminateInstrumentation() {
    await this.instrumentation.terminate();
    await this.instrumentation.setTerminationFn(null);
  }

  async _sendNotificationDataToDevice(dataFileLocalPath, deviceId) {
    await this.fileXfer.prepareDestinationDir(deviceId);
    return await this.fileXfer.send(deviceId, dataFileLocalPath, 'notification.json');
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

  async _waitForProcess(deviceId, bundleId) {
    let pid = NaN;
    try {
      const queryPid = () => this._queryPID(deviceId, bundleId);
      const retryQueryPid = () => retry({ backoff: 'none', retries: 4 }, queryPid);
      const retryQueryPidMultiple = () => retry({ backoff: 'linear' }, retryQueryPid);
      pid = await retryQueryPidMultiple();
    } catch (e) {
      log.warn(await this.adb.shell(deviceId, 'ps'));
      throw e;
    }
    return pid;
  }

  async _queryPID(deviceId, bundleId) {
    const pid = await this.adb.pidof(deviceId, bundleId);
    if (!pid) {
      throw new Error('PID still not available');
    }
    return pid;
  }
}

module.exports = AndroidDriver;
