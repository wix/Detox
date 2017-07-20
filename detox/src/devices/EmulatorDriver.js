const exec = require('./../utils/exec').execWithRetriesAndLogs;
const _ = require('lodash');
const adb = require('adbkit');
const InvocationManager = require('../invoke').InvocationManager;
const DeviceDriverBase = require('./DeviceDriverBase');

class EmulatorDriver extends DeviceDriverBase {

  constructor(client) {
    super(client);
    this._adb = adb.createClient();
    const expect = require('../android/expect');
    expect.exportGlobals();
    expect.setInvocationManager(new InvocationManager(client));
  }

  async acquireFreeDevice(name) {
    const list = await this._adb.listDevices();
    if (!list) {
      throw new Error('There are no Android devices attached to ADB, please start an emulator or connect a device');
    }

    console.log(list);
    return list[0].id;
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
    await this.adbCmd(deviceId, `uninstall ${bundleId}`);
    await this.adbCmd(deviceId, `uninstall ${bundleId}.test`);
  }

  async launch(deviceId, bundleId, launchArgs) {
    const args = [];
    _.forEach(launchArgs, (value, key) => {
      args.push(`${key} ${value}`);
    });

    this.adbCmd(deviceId, `shell am instrument -w -r ${args.join(' ')} -e debug false ${bundleId}.test/android.support.test.runner.AndroidJUnitRunner`);
  }

  async terminate(deviceId, bundleId) {
    await this.adbCmd(deviceId, `shell am force-stop ${bundleId}`);
    //await exec(`adb -s ${deviceId} shell am force-stop ${bundleId}`);
  }

  defaultLaunchArgsPrefix() {
    return '-e ';
  }

  async adbCmd(deviceId, params) {
    await exec(`adb wait-for-device`);
    const cmd = `adb ${deviceId ? `-s ${deviceId}` : ''} ${params}`;
    await exec(cmd);
  }
}

module.exports = EmulatorDriver;
