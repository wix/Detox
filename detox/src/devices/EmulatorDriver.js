const exec = require('./../utils/exec').execWithRetriesAndLogs;
const { spawn } = require('child_process');
const _ = require('lodash');
const InvocationManager = require('../invoke').InvocationManager;

const DeviceDriverBase = require('./DeviceDriverBase');

//ANDROID_SDK_ROOT
const ANDROID_HOME = process.env.ANDROID_HOME;

class EmulatorDriver extends DeviceDriverBase {

  constructor(client) {
    super(client);
    let instrumentationProcess;
    const expect = require('../android/expect');
    expect.exportGlobals();
    expect.setInvocationManager(new InvocationManager(client));
  }

  //async boot(deviceId) {
  //  await exec(`${ANDROID_HOME}/tools/emulator -no-boot-anim -gpu host -no-audio @${deviceId}`);
  //}

  async createDevice() {
    //`android create avd -n <name> -t <targetID>`
  }

  async acquireFreeDevice(name) {
    return (await exec(`adb devices | awk 'NR>1 {print $1}'`, undefined, undefined, 1)).stdout.trim();
  }

  async getBundleIdFromBinary(appPath) {
    const process = await exec(`(aapt dump badging "${appPath}" | awk '/package/{gsub("name=|'"'"'","");  print $2}')`);
    return process.stdout.trim();
  }

  async installApp(deviceId, binaryPath) {
    await this.adbCmd(deviceId, `install -r -g ${binaryPath}`);
    const testApkPath = binaryPath.split('.apk')[0] + '-androidTest.apk';
    await this.adbCmd(deviceId, `install -r -g ${testApkPath}`);
  }

  async uninstallApp(deviceId, bundleId) {
    try {
      await this.adbCmd(deviceId, `uninstall ${bundleId}`);
    } catch (ex) {
      //this is fine
    }

    try {
      await this.adbCmd(deviceId, `uninstall ${bundleId}.test`);
    } catch (ex) {
      //this is fine
    }
  }

  async launch(deviceId, bundleId, launchArgs) {
    const args = [];
    _.forEach(launchArgs, (value, key) => {
      args.push(`${key} ${value}`);
    });

    this.instrumentationProcess = spawn(`adb`, [`-s`, `${deviceId}`, `shell` ,`am`, `instrument`, `-w` ,`-r`, `${args.join(' ')}`,`-e`, `debug`, `false` ,`${bundleId}.test/android.support.test.runner.AndroidJUnitRunner`]);

    console.log('[spawn] childProcess.pid: ', this.instrumentationProcess.pid);
    this.instrumentationProcess.stdout.on('data', function (data) {
      console.log('[spawn] stdout: ', data.toString());
    });
    this.instrumentationProcess.stderr.on('data', function (data) {
      console.log('[spawn] stderr: ', data.toString());
    });

    this.instrumentationProcess.on('close', (code, signal) => {
      console.log(
        `instrumentationProcess terminated due to receipt of signal ${signal}`);
    });
    //this.instrumentationProcess.then(function () {
    //  console.log('[spawn] done!');
    //}).catch(function (err) {
    //  console.error('[spawn] ERROR: ', err);
    //  throw err;
    //});
  }

  async terminate(deviceId, bundleId) {
    this.terminateInstrumentation();
    await this.adbCmd(deviceId, `shell am force-stop ${bundleId}`);
    //await exec(`adb -s ${deviceId} shell am force-stop ${bundleId}`);
  }

  terminateInstrumentation() {
    if (this.instrumentationProcess) {
      this.instrumentationProcess.kill('SIGHUP');
      /*
      try {
        console.log('killing instrumentation process succeded: ', this.instrumentationProcess.kill('SIGTERM'));
      } catch (e) {
        console.log('killing instrumentation process failed', e);
      }
      */
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

  async setOrientation(deviceId, orientation) {
    const orientationMapping = {
      landscape: 1, // top at left side landscape
      portrait: 0  // non-reversed portrait.
    };
    await this.adbCmd(deviceId,`shell settings put system accelerometer_rotation 0`);
    await this.adbCmd(deviceId,`shell settings put system user_rotation ${orientationMapping[orientation]}`);
    // TODO
  }

  async adbCmd(deviceId, params) {
    const serial = `${deviceId ? `-s ${deviceId}` : ''}`;
    await exec(`adb ${serial} wait-for-device`, undefined, undefined, 1);
    const cmd = `adb ${serial} ${params}`;
    await exec(cmd, undefined, undefined, 1);
  }
}

module.exports = EmulatorDriver;
