const exec = require('./../utils/exec').execWithRetriesAndLogs;
const {spawn} = require('child_process');
const _ = require('lodash');
const log = require('npmlog');
const path = require('path');
const invoke = require('../invoke');
const InvocationManager = invoke.InvocationManager;
const ADB = require('./android/ADB');
const AAPT = require('./android/AAPT');
const Emulator = require('./android/Emulator');
const EmulatorTelnet = require('./android/EmulatorTelnet');
const Environment = require('../utils/environment');
const DeviceDriverBase = require('./DeviceDriverBase');

const EspressoDetox = 'com.wix.detox.espresso.EspressoDetox';

class EmulatorDriver extends DeviceDriverBase {

  constructor(client) {
    super(client);
    const expect = require('../android/expect');
    expect.exportGlobals();
    this.invocationManager = new InvocationManager(client);
    expect.setInvocationManager(this.invocationManager);

    this.adb = new ADB();
    this.aapt = new AAPT();
    this.emulator = new Emulator();
  }

  async prepare() {

  }

  async boot(deviceId) {
    await this.emulator.boot(deviceId);
  }

  async acquireFreeDevice(name) {
    const avds = await this.emulator.listAvds();
    if (!avds) {
      const avdmanagerPath = path.join(Environment.getAndroidSDKPath(), 'tools', 'bin', 'avdmanager');
      throw new Error(`Could not find any configured Android Emulator. 
      Try creating a device first, example: ${avdmanagerPath} create avd --force --name Nexus_5X_API_24 --abi x86 --package 'system-images;android-24;google_apis_playstore;x86' --device "Nexus 5X"
      or go to https://developer.android.com/studio/run/managing-avds.html for details on how to create an Emulator.`);
    }
    if (_.indexOf(avds, name) === -1) {
      throw new Error(`Can not boot Android Emulator with the name: '${name}', 
      make sure you choose one of the available emulators: ${avds.toString()}`);
    }

    await this.emulator.boot(name);

    const adbDevices = await this.adb.devices();
    const filteredDevices = _.filter(adbDevices, {type: 'emulator', name: name});

    let adbName;
    switch (filteredDevices.length) {
      case 1:
        const adbDevice = filteredDevices[0];
        adbName = adbDevice.adbName;
        break;
      case 0:
        throw new Error(`Could not find '${name}' on the currently ADB attached devices, 
      try restarting adb 'adb kill-server && adb start-server'`);
        break;
      default:
        throw new Error(`Got more than one device corresponding to the name: ${name}`);
    }

    await this.adb.unlockScreen(adbName);
    return adbName;
  }

  async getBundleIdFromBinary(apkPath) {
    return await this.aapt.getPackageName(apkPath);
  }

  async installApp(deviceId, binaryPath) {
    await this.adb.install(deviceId, binaryPath);
    const testApkPath = binaryPath.split('.apk')[0] + '-androidTest.apk';
    await this.adb.install(deviceId, testApkPath);
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
      let call = invoke.call(invoke.Android.Class("com.wix.detox.Detox"), 'launchMainActivity');
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
    let call = invoke.call(invoke.Android.Class("com.wix.detox.Detox"), 'startActivityFromUrl', invoke.Android.String(params.url));
    await this.invocationManager.execute(call);
  }

  async sendToHome(deviceId, params) {
    let uiDevice = invoke.call(invoke.Android.Class("com.wix.detox.uiautomator.UiAutomator"), 'uiDevice');
    let call = invoke.call(uiDevice, 'pressHome');
    await this.invocationManager.execute(call);
  }

  async shutdown(deviceId) {
    const port = _.split(deviceId, '-')[1];
    const telnet = new EmulatorTelnet();
    await telnet.connect(port);
    await telnet.kill();
  }

  async terminate(deviceId, bundleId) {
    this.terminateInstrumentation();
    await this.adb.terminate(deviceId, bundleId);
  }

  terminateInstrumentation() {
    if (this.instrumentationProcess) {
      this.instrumentationProcess.kill('SIGHUP');
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

  async enableSynchronization() {
    let call = invoke.call(invoke.Android.Class(EspressoDetox), 'setSynchronization', invoke.Android.Boolean(true));
    await this.invocationManager.execute(call);
  }

  async disableSynchronization() {
    let call = invoke.call(invoke.Android.Class(EspressoDetox), 'setSynchronization', invoke.Android.Boolean(false));
    await this.invocationManager.execute(call);
  }

  async setOrientation(deviceId, orientation) {
    const orientationMapping = {
      landscape: 1, // top at left side landscape
      portrait: 0  // non-reversed portrait.
    };
    const EspressoDetox = 'com.wix.detox.espresso.EspressoDetox';
    const invoke = require('../invoke');
    let call = invoke.call(invoke.Android.Class(EspressoDetox), 'changeOrientation', invoke.Android.Integer(orientationMapping[orientation]));
    await this.invocationManager.execute(call);
  }
}

module.exports = EmulatorDriver;
