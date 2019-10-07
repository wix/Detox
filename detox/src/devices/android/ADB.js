const _ = require('lodash');
const path = require('path');
const {execWithRetriesAndLogs, spawnAndLog} = require('../../utils/exec');
const {escape} = require('../../utils/pipeCommands');
const DetoxRuntimeError = require('../../errors/DetoxRuntimeError');
const EmulatorTelnet = require('./EmulatorTelnet');
const {getAdbPath} = require('../../utils/environment');
const {encodeBase64} = require('../../utils/encoding');

class ADB {
  constructor() {
    this._cachedApiLevels = new Map();
    this.adbBin = getAdbPath();
  }

  async devices() {
    const {stdout} = await this.adbCmd('', 'devices', { verbosity: 'high' });
    const devices = _.chain(stdout)
      .trim()
      .split('\n')
      .slice(1)
      .map(s => _.trim(s))
      .map(s => s.startsWith('emulator-')
        ? new EmulatorHandle(s)
        : new DeviceHandle(s))
      .value();

    for (const device of devices) {
      if (device.type === 'emulator') {
        assertEmulatorHasPort(device, stdout);
      }
    }

    return { devices, stdout };
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

  static inferDeviceType(adbName) {
    if (adbName.startsWith('emulator-')) {
      return 'emulator';
    }

    if ((/^((1?\d?\d|25[0-5]|2[0-4]\d)(\.|:)){4}[0-9]{4}/.test(adbName))) {
      return 'genymotion';
    }

    return 'device';
  }
}

function assertEmulatorHasPort(device, stdout) {
  if (device.port) {
    return;
  }

  const errorMessage = [
    `Failed to determine telnet port for emulator device '${device.adbName}'!`,
    `Please help us out by reporting dump below in: https://github.com/wix/Detox/issues/1427`,
    `------ BEGIN DUMP ------`,
    `adb devices base64: ${encodeBase64(stdout)}`,
    `adb devices: ${stdout}`,
    `port: ${device.port}`,
    `------  END DUMP  ------`,
  ].join('\n');

  throw new Error(errorMessage);
}

class DeviceHandle {
  constructor(deviceString) {
    const [adbName, status] = deviceString.split('\t');
    this.type = ADB.inferDeviceType(adbName);
    this.adbName = adbName;
    this.status = status;
  }
}

class EmulatorHandle extends DeviceHandle {
  constructor(deviceString) {
    super(deviceString);

    this.port = this.adbName.split('-')[1];
  }

  queryName() {
    if (!this._name) {
      this._name = this._queryNameViaTelnet();
    }

    return this._name;
  }

  async _queryNameViaTelnet() {
    const telnet = new EmulatorTelnet();

    await telnet.connect(this.port);
    try {
      return await telnet.avdName();
    } finally {
      await telnet.quit();
    }
  }
}

module.exports = ADB;
