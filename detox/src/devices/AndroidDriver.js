const {spawn} = require('child_process');
const fs = require('fs');
const _ = require('lodash');
const log = require('npmlog');
const invoke = require('../invoke');
const InvocationManager = invoke.InvocationManager;
const ADB = require('./android/ADB');
const AAPT = require('./android/AAPT');
const APKPath = require('./android/APKPath');
const DeviceDriverBase = require('./DeviceDriverBase');
const AndroidArtifact = require('./android/AndroidArtifact');

const EspressoDetox = 'com.wix.detox.espresso.EspressoDetox';

class AndroidDriver extends DeviceDriverBase {
  constructor(client) {
    super(client);
    this.expect = require('../android/expect');
    this.invocationManager = new InvocationManager(client);
    this.expect.setInvocationManager(this.invocationManager);
    this._uniqueId = 1;
    this._recordings = {};

    this.adb = new ADB();
    this.aapt = new AAPT();
  }

  exportGlobals() {
    this.expect.exportGlobals();
  }

  async getBundleIdFromBinary(apkPath) {
    return await this.aapt.getPackageName(apkPath);
  }

  async installApp(deviceId, binaryPath) {
    await this.adb.install(deviceId, binaryPath);
    await this.adb.install(deviceId, this.getTestApkPath(binaryPath));
  }

  getTestApkPath(originalApkPath) {
    const testApkPath = APKPath.getTestApkPath(originalApkPath);

    if (!fs.existsSync(testApkPath)) {
      throw new Error(`'${testApkPath}' could not be found, did you run './gradlew assembleAndroidTest' ?`);
    }

    return testApkPath;
  }

  async uninstallApp(deviceId, bundleId) {
    try {
      await this.adb.uninstall(deviceId, bundleId);
    } catch (ex) {
      //this is fine
    }

    try {
      await this.adb.uninstall(deviceId, `${bundleId}.test`);
    } catch (ex) {
      //this is fine
    }
  }

  async launch(deviceId, bundleId, launchArgs) {
    const args = [];
    _.forEach(launchArgs, (value, key) => {
      args.push(`${key} ${value}`);
    });

    if (this.instrumentationProcess) {
      const call = invoke.call(invoke.Android.Class("com.wix.detox.Detox"), 'launchMainActivity');
      await this.invocationManager.execute(call);
      return this.instrumentationProcess.pid;
    }

    this.instrumentationProcess = spawn(`adb`, [`-s`, `${deviceId}`, `shell`, `am`, `instrument`, `-w`, `-r`, `${args.join(' ')}`, `-e`, `debug`,
      `false`, `${bundleId}.test/android.support.test.runner.AndroidJUnitRunner`]);
    log.verbose(this.instrumentationProcess.spawnargs.join(" "));
    log.verbose('Instrumentation spawned, childProcess.pid: ', this.instrumentationProcess.pid);
    this.instrumentationProcess.stdout.on('data', function(data) {
      log.verbose('Instrumentation stdout: ', data.toString());
    });
    this.instrumentationProcess.stderr.on('data', function(data) {
      log.verbose('Instrumentation stderr: ', data.toString());
    });

    this.instrumentationProcess.on('close', (code, signal) => {
      log.verbose(`instrumentationProcess terminated due to receipt of signal ${signal}`);
    });

    return this.instrumentationProcess.pid;
  }

  async openURL(deviceId, params) {
    const call = invoke.call(invoke.Android.Class("com.wix.detox.Detox"), 'startActivityFromUrl', invoke.Android.String(params.url));
    await this.invocationManager.execute(call);
  }

  async sendToHome(deviceId, params) {
    const uiDevice = invoke.call(invoke.Android.Class("com.wix.detox.uiautomator.UiAutomator"), 'uiDevice');
    const call = invoke.call(uiDevice, 'pressHome');
    await this.invocationManager.execute(call);
  }

  async terminate(deviceId, bundleId) {
    this.terminateInstrumentation();
    await this.adb.terminate(deviceId, bundleId);
  }

  terminateInstrumentation() {
    if (this.instrumentationProcess) {
      this.instrumentationProcess.kill();
      this.instrumentationProcess = null;
    }
  }

  async cleanup(deviceId, bundleId) {
    this.terminateInstrumentation();
  }

  defaultLaunchArgsPrefix() {
    return '-e ';
  }

  getPlatform() {
    return 'android';
  }

  async findDeviceId(filter) {
    const adbDevices = await this.adb.devices();
    const filteredDevices = _.filter(adbDevices, filter);

    let adbName;
    switch (filteredDevices.length) {
      case 1:
        const adbDevice = filteredDevices[0];
        adbName = adbDevice.adbName;
        break;
      case 0:
        throw new Error(`Could not find '${filter.name}' on the currently ADB attached devices: '${JSON.stringify(adbDevices)}', 
      try restarting adb 'adb kill-server && adb start-server'`);
        break;
      default:
        throw new Error(`Got more than one device corresponding to the name: ${filter.name}. Current ADB attached devices: ${JSON.stringify(adbDevices)}`);
    }

    return adbName;
  }

  async setURLBlacklist(urlList) {
    const call = invoke.call(invoke.Android.Class(EspressoDetox), 'setURLBlacklist', urlList);
    await this.invocationManager.execute(call);
  }

  async enableSynchronization() {
    const call = invoke.call(invoke.Android.Class(EspressoDetox), 'setSynchronization', invoke.Android.Boolean(true));
    await this.invocationManager.execute(call);
  }

  async disableSynchronization() {
    const call = invoke.call(invoke.Android.Class(EspressoDetox), 'setSynchronization', invoke.Android.Boolean(false));
    await this.invocationManager.execute(call);
  }

  async setOrientation(deviceId, orientation) {
    const orientationMapping = {
      landscape: 1, // top at left side landscape
      portrait: 0 // non-reversed portrait.
    };
    
    const call = invoke.call(invoke.Android.Class(EspressoDetox), 'changeOrientation', invoke.Android.Integer(orientationMapping[orientation]));
    await this.invocationManager.execute(call);
  }

  async takeScreenshot(deviceId) {
    const screenshotPath = this._getScreenshotPath(this._nextId());
    await this.adb.screencap(deviceId, screenshotPath);
    return new AndroidArtifact(screenshotPath, this.adb, deviceId);
  }

  async startVideo(deviceId) {
    const adb = this.adb;
    const videoPath = this._getVideoPath(this._nextId());
    let {width, height} = await adb.getScreenSize();
    let promise = spawnRecording();
    promise.catch(handleRecordingTermination);

    // XXX: ugly loop to make sure we continue only if recording has begun.
    let recording = false;
    let size = 0;
    while (!recording) {
      size = 0;
      recording = true;
      try {
        size = await adb.getFileSize(deviceId, videoPath);
        if (size < 1) {
          recording = false;
        }
      } catch (e) {
        recording = false;
      }
    }

    this._recordings[deviceId] = {
      process: promise.childProcess,
      promise,
      videoPath
    };

    function handleRecordingTermination(result) {
      const proc = result.childProcess;
      // XXX: error code -38 (= 218) means that encoder was not able to create
      // video of current size, let's try smaller resolution.
      if (proc.exitCode === 218) {
        width >>= 1;
        height >>= 1;
        promise = spawnRecording();
        promise.catch(handleRecordingTermination);
      }
    }

    function spawnRecording() {
      return adb.screenrecord(deviceId, videoPath, width, height);
    }
  }

  stopVideo(deviceId) {
    if (this._recordings[deviceId]) {
      const {process, promise, videoPath} = this._recordings[deviceId];
      delete this._recordings[deviceId];
      return new Promise((resolve) => {
        promise.catch(() => resolve(
          new AndroidArtifact(videoPath, this.adb, deviceId)
        ));
        process.kill(2);
      });
    }
    return Promise.resolve(null);
  }

  _nextId() {
    return this._uniqueId++;
  }

  _getVideoPath(id) {
    return `/sdcard/recording-${id}.mp4`;
  }

  _getScreenshotPath(id) {
    return `/sdcard/screenshot-${id}.png`;
  }
}

module.exports = AndroidDriver;
