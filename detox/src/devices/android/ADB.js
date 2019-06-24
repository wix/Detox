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
    const output = (await this.adbCmd('', 'devices', { verbosity: 'high' })).stdout;
    return this.parseAdbDevicesConsoleOutput(output);
  }

  async unlockScreen(deviceId) {
    const {
      mWakefulness,
      mUserActivityTimeoutOverrideFromWindowManager,
    } = await this._getPowerStatus(deviceId);

    if (mWakefulness === 'Asleep') {
      await this.pressPowerDevice(deviceId);
    }

    if (mUserActivityTimeoutOverrideFromWindowManager === '10000') { // screen is locked
      await this.pressOptionsMenu(deviceId);
    }
  }

  async _getPowerStatus(deviceId) {
    const stdout = await this.shell(deviceId, `dumpsys power | grep "^[ ]*m[UW].*="`);

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
        if (!port) {
          _reportTelnetPortResolutionError(input, devicesList, deviceAdbName, port);
        }

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

    const lvl = Number(await this.shell(deviceId, `getprop ro.build.version.sdk`));
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

function _reportTelnetPortResolutionError(input, devicesList, deviceAdbName, port) {
  const log = require('../../utils/logger').child({ __filename });
  const {encodeBase64} = require('../../utils/encoding');
  log.error({event: 'DEVICE_NAME_ERROR'}, `Failed to determine port for emulator device '${deviceAdbName}!!!`);
  log.error({event: 'DEVICE_NAME_ERROR'}, `Please help us out by reporting all DEVICE_NAME_ERROR logs in: https://github.com/wix/Detox/issues/1427`);
  log.error({event: 'DEVICE_NAME_ERROR'}, `State dump ==>`);
  log.error({event: 'DEVICE_NAME_ERROR'}, `adb devices: ${input}`);
  log.error({event: 'DEVICE_NAME_ERROR'}, `adb devices (base64): '${encodeBase64(input)}'`);
  log.error({event: 'DEVICE_NAME_ERROR'}, `devicesList: ${devicesList}`);
  log.error({event: 'DEVICE_NAME_ERROR'}, `port: ${port}`);
  throw new Error(`Unable to determine port for emulator device '${deviceAdbName}'!`);
}

module.exports = ADB;
