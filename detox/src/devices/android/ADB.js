const _ = require('lodash');
const path = require('path');
const {execWithRetriesAndLogs, spawnAndLog} = require('../../utils/exec');
const {escape} = require('../../utils/pipeCommands');
const DetoxRuntimeError = require('../../errors/DetoxRuntimeError');
const EmulatorTelnet = require('./EmulatorTelnet');
const Environment = require('../../utils/environment');

class ADB {
  constructor() {
    this._cachedApiLevels = new Map();
    this.adbBin = path.join(Environment.getAndroidSDKPath(), 'platform-tools', 'adb');
  }

  async devices() {
    const parser = await this._adbDevices();
    const devices = [];
    for (let device = await parser.parseNext(); device; device = await parser.parseNext()) {
      devices.push(device);
    }
    return devices;
  }

  async findDevice(matcher) {
    const parser = await this._adbDevices();
    for (let device = await parser.parseNext(); device; device = await parser.parseNext()) {
      if (await matcher(device)) {
        return device;
      }
    }
    return undefined;
  }

  async unlockScreen(deviceId) {
    const {
      mWakefulness,
      mUserActivityTimeoutOverrideFromWindowManager,
    } = await this._getPowerStatus(deviceId);

    if (mWakefulness === 'Asleep' || mWakefulness === 'Dozing') {
      await this.pressPowerDevice(deviceId);
    }

    if (mUserActivityTimeoutOverrideFromWindowManager === '10000') { // screen is locked
      await this.pressOptionsMenu(deviceId);
    }
  }

  async _getPowerStatus(deviceId) {
    const stdout = await this.shell(deviceId, `dumpsys power | grep "^[ ]*m[UW].*="`, { retries: 5 });
    return stdout
      .split('\n')
      .map(s => s.trim().split('='))
      .reduce((acc, [key, value]) => ({
        ...acc,
        [key]: value,
      }), {});
  }

  async pressOptionsMenu(deviceId) {
    await this._sendKeyEvent(deviceId, 'KEYCODE_MENU');
  }

  async pressPowerDevice(deviceId) {
    await this._sendKeyEvent(deviceId, 'KEYCODE_POWER');
  }

  async _sendKeyEvent(deviceId, keyevent) {
    await this.shell(deviceId, `input keyevent ${keyevent}`);
  }

  async now(deviceId) {
    return this.shell(deviceId, `date +"%m-%d %T.000"`);
  }

  async isPackageInstalled(deviceId, packageId) {
    const output = await this.shell(deviceId, `pm list packages ${packageId}`);
    const packageRegexp = new RegExp(`^package:${escape.inQuotedRegexp(packageId)}$`, 'm');
    const isInstalled = packageRegexp.test(output);

    return isInstalled;
  }

  async install(deviceId, apkPath) {
    apkPath = `"${escape.inQuotedString(apkPath)}"`;

    const apiLvl = await this.apiLevel(deviceId);

    let childProcess;
    if (apiLvl >= 24) {
      childProcess = await this.adbCmd(deviceId, `install -r -g -t ${apkPath}`);
    } else {
      childProcess = await this.adbCmd(deviceId, `install -rg ${apkPath}`);
    }

    const [failure] = (childProcess.stdout || '').match(/^Failure \[.*\]$/m) || [];
    if (failure) {
      throw new DetoxRuntimeError({
        message: `Failed to install app on ${deviceId}: ${apkPath}`,
        debugInfo: failure,
      });
    }
  }

  async uninstall(deviceId, appId) {
    await this.adbCmd(deviceId, `uninstall ${appId}`);
  }

  async terminate(deviceId, appId) {
    await this.shell(deviceId, `am force-stop ${appId}`);
  }

  async pidof(deviceId, bundleId) {
    const bundleIdRegex = escape.inQuotedRegexp(bundleId) + '$';

    const processes = await this.shell(deviceId, `ps | grep "${bundleIdRegex}"`, {silent: true}).catch(() => '');
    if (!processes) {
      return NaN;
    }

    return parseInt(processes.split(' ').filter(Boolean)[1], 10);
  }

  async getFileSize(deviceId, filename) {
    const { stdout, stderr } = await this.adbCmd(deviceId, 'shell du ' + filename).catch(e => e);

    if (stderr.includes('No such file or directory')) {
      return -1;
    }

    return Number(stdout.slice(0, stdout.indexOf(' ')));
  }

  async isBootComplete(deviceId) {
    try {
      const bootComplete = await this.shell(deviceId, `getprop dev.bootcomplete`, { silent: true });
      return (bootComplete === '1');
    } catch (ex) {
      return false;
    }
  }

  async apiLevel(deviceId) {
    if (this._cachedApiLevels.has(deviceId)) {
      return this._cachedApiLevels.get(deviceId);
    }

    const lvl = Number(await this.shell(deviceId, `getprop ro.build.version.sdk`, { retries: 5 }));
    this._cachedApiLevels.set(deviceId, lvl);

    return lvl;
  }

  async screencap(deviceId, path) {
    await this.shell(deviceId, `screencap ${path}`);
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
  logcat(deviceId, { file, pid, time }) {
    let shellCommand = 'logcat';

    // HACK: cannot make this function async, otherwise ChildProcessPromise.childProcess field will get lost,
    // and this will break interruptProcess() call for any logcat promise.
    const apiLevel = this._cachedApiLevels.get(deviceId);
    if (time && apiLevel >= 21) {
      shellCommand += ` -T "${time}"`;
    }

    if (apiLevel < 24) {
      if (pid > 0) {
        const __pid = String(pid).padStart(5);
        shellCommand += ` -v brief | grep "(${__pid}):"`;
      }

      if (file) {
        shellCommand += ` >> ${file}`;
      }
    } else {
      if (pid > 0) {
        shellCommand += ` --pid=${pid}`;
      }

      if (file) {
        shellCommand += ` -f ${file}`;
      }
    }

    return this.spawn(deviceId, ['shell', shellCommand]);
  }

  async pull(deviceId, src, dst = '') {
    await this.adbCmd(deviceId, `pull "${src}" "${dst}"`);
  }

  async rm(deviceId, path, force = false) {
    await this.shell(deviceId, `rm ${force ? '-f' : ''} "${path}"`);
  }

  async listInstrumentation(deviceId) {
    return this.shell(deviceId, 'pm list instrumentation');
  }

  async getInstrumentationRunner(deviceId, bundleId) {
    const instrumentationRunners = await this.listInstrumentation(deviceId);
    const instrumentationRunner = this._instrumentationRunnerForBundleId(instrumentationRunners, bundleId);
    if (instrumentationRunner === 'undefined') {
      throw new Error(`No instrumentation runner found on device ${deviceId} for package ${bundleId}`);
    }

    return instrumentationRunner;
  }

  _instrumentationRunnerForBundleId(instrumentationRunners, bundleId) {
    const runnerForBundleRegEx = new RegExp(`^instrumentation:(.*) \\(target=${bundleId.replace(new RegExp('\\.', 'g'), "\\.")}\\)$`, 'gm');
    return _.get(runnerForBundleRegEx.exec(instrumentationRunners), [1], 'undefined');
  }

  async shell(deviceId, cmd, options) {
    return (await this.adbCmd(deviceId, `shell "${escape.inQuotedString(cmd)}"`, options)).stdout.trim();
  }

  async reverse(deviceId, port) {
    return this.adbCmd(deviceId, `reverse tcp:${port} tcp:${port}`);
  }

  async reverseRemove(deviceId, port) {
    return this.adbCmd(deviceId, `reverse --remove tcp:${port}`);
  }

  async _adbDevices() {
    const output = (await this.adbCmd('', 'devices', { verbosity: 'high' })).stdout;
    return new ADBDevicesParser(output);
  }

  async adbCmd(deviceId, params, options) {
    const serial = `${deviceId ? `-s ${deviceId}` : ''}`;
    const cmd = `${this.adbBin} ${serial} ${params}`;
    const retries = _.get(options, 'retries', 1);
    _.unset(options, 'retries');

    return execWithRetriesAndLogs(cmd, options, undefined, retries);
  }

  /***
   * @returns {ChildProcessPromise}
   */
  spawn(deviceId, params) {
    const serial = deviceId ? ['-s', deviceId] : [];
    return spawnAndLog(this.adbBin, [...serial, ...params]);
  }
}

class ADBDevicesParser {
  constructor(adbDevicesOutput) {
    this.rawInput = adbDevicesOutput;
    this.devicesList = this._extractDeviceNamesFromAdbDevicesOutput(adbDevicesOutput);
    this.index = 0;
  }

  async parseNext() {
    if (this.index < this.devicesList.length) {
      return await this._parseAdbDevice(this.devicesList[this.index++]);
    }
    return undefined;
  }

  _extractDeviceNamesFromAdbDevicesOutput(input) {
    const outputToList = input.trim().split('\n');
    const devicesList = _.takeRight(outputToList, outputToList.length - 1);
    return devicesList;
  }

  async _parseAdbDevice(deviceString) {
    const deviceParams = deviceString.split('\t');
    const adbName = deviceParams[0];

    let device;
    if (isEmulator(adbName)) {
      const port = _.split(adbName, '-')[1];
      if (!port) {
        _reportTelnetPortResolutionError(this.rawInput, this.devicesList, adbName, port);
      }

      const telnet = new EmulatorTelnet();
      await telnet.connect(port);
      const name = await telnet.avdName();
      device = {type: 'emulator', name: name, adbName, port};
      await telnet.quit();
    } else if (isGenymotion(adbName)) {
      device = {type: 'genymotion', name: adbName, adbName};
    } else {
      device = {type: 'device', name: adbName, adbName};
    }
    return device;
  }
}

function isEmulator(deviceAdbName) {
  return _.includes(deviceAdbName, 'emulator-');
}

function isGenymotion(adbName) {
  return (/^((1?\d?\d|25[0-5]|2[0-4]\d)(\.|:)){4}[0-9]{4}/.test(adbName));
}

function _reportTelnetPortResolutionError(input, devicesList, deviceAdbName, port) {
  const {encodeBase64} = require('../../utils/encoding');
  const errorMessage = [
    `Failed to determine telnet port for emulator device '${deviceAdbName}'!`,
    `Please help us out by reporting dump below in: https://github.com/wix/Detox/issues/1427`,
    `------ BEGIN DUMP ------`,
    `adb devices base64: ${encodeBase64(input)}`,
    `adb devices: ${input}`,
    `devicesList: ${devicesList}`,
    `port: ${port}`,
    `------  END DUMP  ------`,
  ].join('\n');

  throw new Error(errorMessage);
}

module.exports = ADB;
