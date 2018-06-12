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
const DetoxApi = require('../android/espressoapi/Detox');
const EspressoDetoxApi = require('../android/espressoapi/EspressoDetox');
const UIAutomatorAPI = require('../android/espressoapi/UIAutomator');
const UIDevice = require('../android/espressoapi/UIDevice');
const ADBLogcatPlugin = require('../artifacts/log/android/ADBLogcatPlugin');
const ADBScreencapPlugin = require('../artifacts/screenshot/ADBScreencapPlugin');
const ADBScreenrecorderPlugin = require('../artifacts/video/ADBScreenrecorderPlugin');
const AndroidDevicePathBuilder = require('../artifacts/utils/AndroidDevicePathBuilder');
const sleep = require('../utils/sleep');

const EspressoDetox = 'com.wix.detox.espresso.EspressoDetox';

class AndroidDriver extends DeviceDriverBase {
  constructor(client) {
    super(client);
    this.expect = require('../android/expect');
    this.invocationManager = new InvocationManager(client);
    this.expect.setInvocationManager(this.invocationManager);

    this.adb = new ADB();
    this.aapt = new AAPT();
  }

  declareArtifactPlugins() {
    const adb = this.adb;
    const devicePathBuilder = new AndroidDevicePathBuilder();

    return {
      log: (api) => new ADBLogcatPlugin({ api, adb, devicePathBuilder }),
      screenshot: (api) => new ADBScreencapPlugin({ api, adb, devicePathBuilder }),
      video: (api) => new ADBScreenrecorderPlugin({ api, adb, devicePathBuilder }),
    };
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
      const call = DetoxApi.launchMainActivity();
      await this.invocationManager.execute(call);
      return this._queryPID(deviceId, bundleId);
    }

    const testRunner = await this.adb.getInstrumentationRunner(deviceId, bundleId);

    this.instrumentationProcess = spawn(this.adb.adbBin, [`-s`, `${deviceId}`, `shell`, `am`, `instrument`, `-w`, `-r`, `${args.join(' ')}`, `-e`, `debug`,
      `false`, testRunner]);
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
      this.terminateInstrumentation();
    });

    return this._queryPID(deviceId, bundleId);
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

  async deliverPayload(params) {
    if(params.url) {
      const call = DetoxApi.startActivityFromUrl(params.url);
      await this.invocationManager.execute(call);
    }

    //The other types are not yet supported.
  }

  async sendToHome(deviceId, params) {
    const call = UIDevice.pressHome(invoke.callDirectly(UIAutomatorAPI.uiDevice()));
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

  async setOrientation(deviceId, orientation) {
    const orientationMapping = {
      landscape: 1, // top at left side landscape
      portrait: 0 // non-reversed portrait.
    };

    const call = EspressoDetoxApi.changeOrientation(orientationMapping[orientation]);
    await this.invocationManager.execute(call);
  }
}

module.exports = AndroidDriver;
