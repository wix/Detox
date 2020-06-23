const fs = require('fs');
const URL = require('url').URL;
const _ = require('lodash');
const { encodeBase64 } = require('../../../utils/encoding');
const logger = require('../../../utils/logger');
const log = logger.child({ __filename });
const invoke = require('../../../invoke');
const InvocationManager = invoke.InvocationManager;
const ADB = require('./tools/ADB');
const AAPT = require('./tools/AAPT');
const APKPath = require('./tools/APKPath');
const TempFileXfer = require('./tools/TempFileXfer');
const AppUninstallHelper = require('./tools/AppUninstallHelper');
const DeviceDriverBase = require('../DeviceDriverBase');
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
const DetoxRuntimeError = require('../../../errors/DetoxRuntimeError');
const sleep = require('../../../utils/sleep');
const retry = require('../../../utils/retry');
const { interruptProcess } = require('../../../utils/exec');
const getAbsoluteBinaryPath = require('../../../utils/getAbsoluteBinaryPath');
const AndroidExpect = require('../../../android/expect');
const { InstrumentationLogsParser } = require('./InstrumentationLogsParser');

const reservedInstrumentationArgs = ['class', 'package', 'func', 'unit', 'size', 'perf', 'debug', 'log', 'emma', 'coverageFile'];
const isReservedInstrumentationArg = (arg) => reservedInstrumentationArgs.includes(arg);

class AndroidDriver extends DeviceDriverBase {
  constructor(config) {
    super(config);

    this.instrumentationLogsParser = null;
    this.instrumentationProcess = null;
    this.instrumentationStackTrace = '';
    this.instrumentationCloseListener = _.noop;

    this.invocationManager = new InvocationManager(this.client);
    this.matchers = new AndroidExpect(this.invocationManager);
    this.uiDevice = new UiDeviceProxy(this.invocationManager).getUIDevice();

    this.adb = new ADB();
    this.aapt = new AAPT();
    this.fileXfer = new TempFileXfer(this.adb);
    this.devicePathBuilder = new AndroidDevicePathBuilder();
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
    const uninstallHelper = new AppUninstallHelper(this.adb);
    await uninstallHelper.uninstall(deviceId, bundleId);
  }

  async launchApp(deviceId, bundleId, launchArgs, languageAndLocale) {
    let notificationPayloadTargetPath;

    await this.emitter.emit('beforeLaunchApp', { deviceId, bundleId, launchArgs });

    if (launchArgs.detoxUserNotificationDataURL) {
      notificationPayloadTargetPath = await this._sendNotificationDataToDevice(launchArgs.detoxUserNotificationDataURL, deviceId);
      launchArgs = {
        ...launchArgs,
        detoxUserNotificationDataURL: notificationPayloadTargetPath,
      }
    }

    if (!this._isInstrumentationRunning()) {
      await this._launchInstrumentationProcess(deviceId, bundleId, launchArgs);
      await sleep(500);
    } else if (launchArgs.detoxURLOverride) {
      await this._startActivityWithUrl(launchArgs.detoxURLOverride);
    } else if (launchArgs.detoxUserNotificationDataURL) {
      await this._startActivityFromNotification(launchArgs.detoxUserNotificationDataURL);
    } else {
      await this._resumeMainActivity();
    }

    let pid = NaN;
    try {
      pid = await retry(() => this._queryPID(deviceId, bundleId));
    } catch (e) {
      log.warn(await this.adb.shell(deviceId, 'ps'));
      throw e;
    }

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
        await Promise.race([
          super.waitUntilReady(),
          new Promise((resolve, reject) => {
            this.instrumentationCloseListener = () => reject(this._getInstrumentationCrashError());
            !this._isInstrumentationRunning() && this.instrumentationCloseListener();
          }),
        ]);
      } finally {
        this.instrumentationCloseListener = _.noop;
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

  async _terminateInstrumentation() {
    if (this._isInstrumentationRunning()) {
      await interruptProcess(this.instrumentationProcess);
      this.instrumentationProcess = null;
      this.instrumentationCloseListener();
    }
  }

  _isInstrumentationRunning() {
    return !!this.instrumentationProcess;
  }

  _getInstrumentationCrashError() {
    return new DetoxRuntimeError({
      message: 'Failed to run application on the device',
      hint: this.instrumentationStackTrace
        ? 'Most likely, your main activity has crashed prematurely.'
        : 'Most likely, your tests have timed out and called detox.cleanup() ' +
          'while it was waiting for "ready" message (over WebSocket) ' +
          'from the instrumentation process.',
      debugInfo: this.instrumentationStackTrace
        ? `Native stacktrace dump: ${this.instrumentationStackTrace}`
        : '',
    });
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
    const call = EspressoDetoxApi.setURLBlacklist(urlList);
    await this.invocationManager.execute(call);
  }

  async enableSynchronization() {
    const call = EspressoDetoxApi.setSynchronization(true);
    await this.invocationManager.execute(call);
  }

  async disableSynchronization() {
    const call = EspressoDetoxApi.setSynchronization(false);
    await this.invocationManager.execute(call);
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

  async _launchInstrumentationProcess(deviceId, bundleId, rawLaunchArgs) {
    const launchArgs = this._prepareLaunchArgs(rawLaunchArgs, true);
    const additionalLaunchArgs = this._prepareLaunchArgs({debug: false});
    const serverPort = new URL(this.client.configuration.server).port;
    await this.adb.reverse(deviceId, serverPort);
    const testRunner = await this.adb.getInstrumentationRunner(deviceId, bundleId);
    const spawnFlags = [...launchArgs, ...additionalLaunchArgs];

    this.instrumentationLogsParser = new InstrumentationLogsParser();
    this.instrumentationProcess = this.adb.spawnInstrumentation(deviceId, spawnFlags, testRunner);
    this.instrumentationProcess.childProcess.stdout.setEncoding('utf8');
    this.instrumentationProcess.childProcess.stdout.on('data', this._extractStackTraceFromInstrumLogs.bind(this));
    this.instrumentationProcess.childProcess.on('close', async () => {
      await this._terminateInstrumentation();
      await this.adb.reverseRemove(deviceId, serverPort);
    });
  }

  _extractStackTraceFromInstrumLogs(logsDump) {
    this.instrumentationLogsParser.parse(logsDump);

    if (this.instrumentationLogsParser.containsStackTraceLog(logsDump)) {
      this.instrumentationStackTrace = this.instrumentationLogsParser.getStackTrace(logsDump);
    }
  }

  async _queryPID(deviceId, bundleId, waitAtStart = true) {
    if (waitAtStart) {
      await sleep(500);
    }

    for (let attempts = 5; attempts > 0; attempts--) {
      const pid = await this.adb.pidof(deviceId, bundleId);

      if (pid > 0) {
        return pid;
      }

      await sleep(1000);
    }

    return NaN;
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

  _prepareLaunchArgs(launchArgs, verbose = false) {
    const usedReservedArgs = [];
    const preparedLaunchArgs = _.reduce(launchArgs, (result, value, key) => {
      const valueAsString = _.isString(value) ? value : JSON.stringify(value);

      let valueEncoded = valueAsString;
      if (isReservedInstrumentationArg(key)) {
        usedReservedArgs.push(key);
      } else if (!key.startsWith('detox')) {
        valueEncoded = encodeBase64(valueAsString);
      }

      result.push('-e', key, valueEncoded);
      return result;
    }, []);

    if (verbose && usedReservedArgs.length) {
      logger.warn([`Arguments [${usedReservedArgs}] were passed in as launchArgs to device.launchApp() `,
                   'but are reserved to Android\'s test-instrumentation and will not be passed into the app. ',
                   'Ignore this message if this is what you meant to do. Refer to ',
                   'https://developer.android.com/studio/test/command-line#AMOptionsSyntax for ',
                   'further details.'].join(''));
    }
    return preparedLaunchArgs;
  }
}

module.exports = AndroidDriver;
