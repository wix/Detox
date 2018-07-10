const _ = require('lodash');
const child_process = require('child_process');
const path = require('path');
const {execWithRetriesAndLogs, spawnAndLog} = require('../../utils/exec');
const EmulatorTelnet = require('./EmulatorTelnet');
const Environment = require('../../utils/environment');

class ADB {

  constructor() {
    this.adbBin = path.join(Environment.getAndroidSDKPath(), 'platform-tools', 'adb');
  }

  async devices() {
    const output = (await this.adbCmd('', 'devices')).stdout;
    return await this.parseAdbDevicesConsoleOutput(output);
  }

  async parseAdbDevicesConsoleOutput(input) {
    const outputToList = input.trim().split('\n');
    const devicesList = _.takeRight(outputToList, outputToList.length - 1);
    const devices = [];
    for (const deviceString of devicesList) {
      const deviceParams = deviceString.split('\t');
      const deviceAdbName = deviceParams[0];
      let device;
      if (this.isEmulator(deviceAdbName)) {
        const port = _.split(deviceAdbName, '-')[1];
        const telnet = new EmulatorTelnet();
        await telnet.connect(port);
        const name = await telnet.avdName();
        device = {type: 'emulator', name: name, adbName: deviceAdbName, port: port};
        await telnet.quit();
      } else if (this.isGenymotion(deviceAdbName)) {
        device = {type: 'genymotion', name: deviceAdbName, adbName: deviceAdbName};
      } else {
        device = {type: 'device', name: deviceAdbName, adbName: deviceAdbName};
      }
      devices.push(device);
    }
    return devices;
  }

  isEmulator(deviceAdbName) {
    return _.includes(deviceAdbName, 'emulator-');
  }

  isGenymotion(string) {
    return (/^((1?\d?\d|25[0-5]|2[0-4]\d)(\.|:)){4}[0-9]{4}/.test(string));
  }

  async install(deviceId, apkPath) {
    const apiLvl = await this.apiLevel(deviceId);
    if (apiLvl >= 24) {
      await this.adbCmd(deviceId, `install -r -g ${apkPath}`);
    } else {
      await this.adbCmd(deviceId, `install -rg ${apkPath}`);
    }
  }

  async uninstall(deviceId, appId) {
    await this.adbCmd(deviceId, `uninstall ${appId}`);
  }

  async terminate(deviceId, appId) {
    await this.shell(deviceId, `am force-stop ${appId}`);
  }

  async unlockScreen(deviceId) {
    await this.shell(deviceId, `input keyevent 82`);
  }

  async pidof(deviceId, bundleId) {
    const processes = await this.shell(deviceId, `ps -AMo NAME,PID`);
    const bundleIndex = processes.indexOf(bundleId + ' ');

    if (bundleIndex === -1) {
      return NaN;
    }

    const pidStart = bundleIndex + bundleId.length + 1;
    const pidEnd = processes.indexOf('\n', pidStart);

    const pidString = (pidEnd === -1)
      ? processes.slice(pidStart)
      : processes.slice(pidStart, pidEnd);

    return parseInt(pidString, 10);
  }

  async shell(deviceId, cmd) {
    return (await this.adbCmd(deviceId, `shell ${cmd}`)).stdout.trim();
  }

  async getFileSize(deviceId, filename) {
    const { stdout, stderr } = await this.adbCmd(deviceId, 'shell wc -c ' + filename).catch(e => e);

    if (stderr.includes('No such file or directory')) {
      return -1;
    }

    return Number(stdout.slice(0, stdout.indexOf(' ')));
  }

  async isFileOpen(deviceId, filename) {
    const openedByProcesses = await this.shell(deviceId, 'lsof ' + filename);
    return openedByProcesses.length > 0;
  }

  async isBootComplete(deviceId) {
    try {
      const bootComplete = await this.shell(deviceId, `getprop dev.bootcomplete`);
      return (bootComplete === '1');
    } catch (ex) {
      return false;
    }
  }

  async apiLevel(deviceId) {
    const lvl = await this.shell(deviceId, `getprop ro.build.version.sdk`);
    return Number(lvl);
  }

  async screencap(deviceId, path) {
    return this.adbCmd(deviceId, `shell screencap ${path}`);
  }

  /***
   * @returns ChildProcessPromise
   */
  screenrecord(deviceId, { path, size, bitRate, timeLimit, verbose }) {
    const [ width = 0, height = 0 ] = size || [];

    const _size = (width > 0) && (height > 0)
      ? ['--size', `${width}x${height}`]
      : [];

    const _bitRate = (bitRate > 0)
      ? ['--bit-rate', String(bitRate)]
      : [];

    const _timeLimit = (timeLimit > 0)
      ? [`--time-limit`, timeLimit]
      : [];

    const _verbose = verbose ? ['--verbose'] : [];
    const screenRecordArgs = [..._size, ..._bitRate, ..._timeLimit, ..._verbose, path];

    return this.spawn(deviceId, ['shell', 'screenrecord', ...screenRecordArgs]);
  }

  /***
   * @returns ChildProcessPromise
   */
  logcat(deviceId, { expression, file, pid, time }) {
    const logcatArgs = [];

    if (expression) {
      logcatArgs.push('-e');
      logcatArgs.push(expression);
    }

    if (file) {
      logcatArgs.push('-f');
      logcatArgs.push(file);
    }

    if (pid > 0) {
      logcatArgs.push(`--pid=${pid}`);
    }

    if (time) {
      logcatArgs.push('-T');
      logcatArgs.push(time);
    }

    return this.spawn(deviceId, ['logcat', ...logcatArgs]);
  }

  async pull(deviceId, src, dst = '') {
    return this.adbCmd(deviceId, `pull "${src}" "${dst}"`);
  }

  async rm(deviceId, path, force = false) {
    return this.adbCmd(deviceId, `shell rm ${force ? '-f' : ''} "${path}"`);
  }

  rmSync(deviceId, path) {
    const cmd = `${this.adbBin} -s ${deviceId} shell rm -rf "${path}"`;
    child_process.execSync(cmd);
  }

  async adbCmd(deviceId, params) {
    const serial = `${deviceId ? `-s ${deviceId}` : ''}`;
    const cmd = `${this.adbBin} ${serial} ${params}`;
    return await execWithRetriesAndLogs(cmd, undefined, undefined, 1);
  }

  /***
   * @returns {ChildProcessPromise}
   */
  spawn(deviceId, params) {
    const serial = deviceId ? ['-s', deviceId] : [];
    return spawnAndLog(this.adbBin, [...serial, ...params]);
  }

  async listInstrumentation(deviceId) {
    return await this.shell(deviceId, 'pm list instrumentation');
  }

  instrumentationRunnerForBundleId(instrumentationRunners, bundleId) {
    const runnerForBundleRegEx = new RegExp(`^instrumentation:(.*) \\(target=${bundleId.replace(new RegExp('\\.', 'g'), "\\.")}\\)$`, 'gm');
    return _.get(runnerForBundleRegEx.exec(instrumentationRunners), [1], 'undefined');
  }

  async getInstrumentationRunner(deviceId, bundleId) {
    const instrumentationRunners = await this.listInstrumentation(deviceId);
    const instrumentationRunner = this.instrumentationRunnerForBundleId(instrumentationRunners, bundleId);
    if (instrumentationRunner === 'undefined') throw new Error(`No instrumentation runner found on device ${deviceId} for package ${bundleId}`);
    return instrumentationRunner;
  }
}

module.exports = ADB;
