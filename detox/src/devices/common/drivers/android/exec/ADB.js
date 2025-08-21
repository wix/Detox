// @ts-nocheck
const _ = require('lodash');

const DetoxRuntimeError = require('../../../../../errors/DetoxRuntimeError');
const { execWithRetriesAndLogs, spawnWithRetriesAndLogs, spawnAndLog } = require('../../../../../utils/childProcess');
const { getAdbPath } = require('../../../../../utils/environment');
const { escape } = require('../../../../../utils/pipeCommands');
const DeviceHandle = require('../tools/DeviceHandle');
const EmulatorHandle = require('../tools/EmulatorHandle');

const ADBCache = require('./ADBCache');

const DEFAULT_EXEC_OPTIONS = {
  retries: 1,
};
const DEFAULT_INSTALL_OPTIONS = {
  timeout: 60000,
  retries: 3,
};

class ADB {
  constructor(options = {}) {
    this.adbBin = options.adbBin || getAdbPath();
    this.deviceId = options.deviceId;
    this.defaultExecOptions = options.defaultExecOptions || DEFAULT_EXEC_OPTIONS;
    this.installOptions = options.installOptions || DEFAULT_INSTALL_OPTIONS;
    this._cache = options.cache || ADBCache.instance;
  }

  get _cachedApiLevels() {
    return this._cache.apiLevels;
  }

  bind(options) {
    return new ADB({
      adbBin: this.adbBin,
      cache: this._cache,
      deviceId: this.deviceId,
      ...options,
    });
  }

  async startDaemon() {
    await this.adbCmd('', 'start-server', { retries: 0, verbosity: 'high' });
  }

  async devices(options) {
    const { stdout } = await this.adbCmd('', 'devices', { verbosity: 'high', ...options });
    /** @type {DeviceHandle[]} */
    const devices = _.chain(stdout)
      .trim()
      .split('\n')
      .slice(1)
      .map(s => _.trim(s))
      .map(s => s.startsWith('emulator-')
        ? new EmulatorHandle(s)
        : new DeviceHandle(s))
      .value();
    return { devices, stdout };
  }

  async getState() {
    try {
      const output = await this.adbCmd(this.deviceId, `get-state`, {
        verbosity: 'low'
      });

      return output.stdout.trim();
    } catch (e) {
      const stderr = e.stderr || '';
      if (stderr.includes('not found')) {
        return 'none';
      } else {
        throw e;
      }
    }
  }

  async unlockScreen() {
    const {
      mWakefulness,
      mUserActivityTimeoutOverrideFromWindowManager,
    } = await this._getPowerStatus();

    if (mWakefulness === 'Asleep' || mWakefulness === 'Dozing') {
      await this.pressPowerDevice();
    }

    if (mUserActivityTimeoutOverrideFromWindowManager === '10000') { // screen is locked
      await this.pressOptionsMenu();
    }
  }

  async _getPowerStatus() {
    const stdout = await this.shell(`dumpsys power | grep "^[ ]*m[UW].*="`, { retries: 5 });
    return stdout
      .split('\n')
      .map(s => s.trim().split('='))
      .reduce((acc, [key, value]) => ({
        ...acc,
        [key]: value,
      }), {});
  }

  async pressOptionsMenu() {
    await this._sendKeyEvent('KEYCODE_MENU');
  }

  async pressPowerDevice() {
    await this._sendKeyEvent('KEYCODE_POWER');
  }

  async typeText(text) {
    const actualText = text.replace(/ /g, '%s');
    await this.shell(`input text ${actualText}`);
  }

  async _sendKeyEvent(keyevent) {
    await this.shell(`input keyevent ${keyevent}`);
  }

  async now() {
    return this.shell(`date +"%m-%d %T.000"`);
  }

  async isPackageInstalled(packageId) {
    const output = await this.shell(`pm list packages ${packageId}`);
    const packageRegexp = new RegExp(`^package:${escape.inQuotedRegexp(packageId)}$`, 'm');
    const isInstalled = packageRegexp.test(output);

    return isInstalled;
  }

  async install(_apkPath) {
    const apkPath = escape.inQuotedString(_apkPath);
    const apiLvl = await this.apiLevel();
    const command = (apiLvl >= 23)
      ? `install -r -g -t ${apkPath}`
      : `install -rg ${apkPath}`;
    const result = await this.adbCmdSpawned(this.deviceId, command, this.installOptions);

    const [failure] = (result.stdout || '').match(/^Failure \[.*\]$/m) || [];
    if (failure) {
      throw new DetoxRuntimeError({
        message: `Failed to install app on ${this.deviceId}: ${apkPath}`,
        debugInfo: failure,
      });
    }
  }

  async remoteInstall(path) {
    const apiLvl = await this.apiLevel();
    const command = (apiLvl >= 23)
      ? `pm install -r -g -t ${path}`
      : `pm install -rg ${path}`;
    return this.shellSpawned(command, this.installOptions);
  }

  async uninstall(appId) {
    await this.adbCmd(this.deviceId, `uninstall ${appId}`);
  }

  async terminate(appId) {
    await this.shell(`am force-stop ${appId}`);
  }

  async setLocation(lat, lon) {
    // NOTE: QEMU for Android for the telnet part relies on C stdlib
    // function `strtod` which is locale-sensitive, meaning that depending
    // on user environment you'll have to send either comma-separated
    // numbers or dot-separated ones.
    //
    // See: https://android.googlesource.com/platform/external/qemu/+/ae0eaf51751391abea2639a65200e724131dc3d6/android/console.c#2273
    //
    // As by default Node.js is distributed without ICU, the locale issue
    // becomes tricky to solve across different platforms, that's why
    // it's easier for us just to send 2 commands in a row, ignoring one
    // which will obviously fail.
    //
    // Since `adb emu` commands fail silently, .catch() is not necessary.

    const dot = `${lon} ${lat}`;
    const comma = dot.replace(/\./g, ',');

    await this.emu(`geo fix ${dot}`);
    await this.emu(`geo fix ${comma}`);
  }

  async pidof(bundleId) {
    const bundleIdRegex = escape.inQuotedRegexp(bundleId) + '$';
    const command = `ps | grep "${bundleIdRegex}"`;
    const options = { silent: true };

    const processes = await this.shell(command, options).catch(() => '');
    if (!processes) {
      return NaN;
    }

    return parseInt(processes.split(' ').filter(Boolean)[1], 10);
  }

  async getFileSize(filename) {
    const { stdout, stderr } = await this.adbCmd(this.deviceId, 'shell du ' + filename).catch(e => e);

    if (stderr.includes('No such file or directory')) {
      return -1;
    }

    return Number(stdout.slice(0, stdout.indexOf(' ')));
  }

  async isBootComplete() {
    try {
      const bootComplete = await this.shell(`getprop dev.bootcomplete`, { retries: 0, silent: true });
      return (bootComplete === '1');
    } catch (ex) {
      return false;
    }
  }

  async waitForDevice() {
    return await this.adbCmd(this.deviceId, 'wait-for-device');
  }

  async apiLevel() {
    if (this._cachedApiLevels.has(this.deviceId)) {
      return this._cachedApiLevels.get(this.deviceId);
    }

    const lvl = Number(await this.shell(`getprop ro.build.version.sdk`, { retries: 5 }));
    this._cachedApiLevels.set(this.deviceId, lvl);

    return lvl;
  }

  async disableAndroidAnimations() {
    await this.shell(`settings put global animator_duration_scale 0`);
    await this.shell(`settings put global window_animation_scale 0`);
    await this.shell(`settings put global transition_animation_scale 0`);
  }

  async setWiFiToggle(state) {
    const value = (state === true ? 'enable' : 'disable');
    await this.shell(`svc wifi ${value}`);
  }

  async screencap(path) {
    await this.shell(`screencap ${path}`);
  }

  /***
   * @returns ChildProcessPromise
   */
  screenrecord({ path, size, bitRate, timeLimit, verbose }) {
    const [width = 0, height = 0] = size || [];

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

    return this.spawn(this.deviceId, ['shell', 'screenrecord', ...screenRecordArgs]);
  }

  /***
   * @returns ChildProcessPromise
   */
  logcat({ file, pid, time }) {
    let shellCommand = 'logcat';

    // HACK: cannot make this function async, otherwise ChildProcessPromise.childProcess field will get lost,
    // and this will break interruptProcess() call for any logcat promise.
    const apiLevel = this._cachedApiLevels.get(this.deviceId);
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

    return this.spawn(this.deviceId, ['shell', shellCommand]);
  }

  async push(src, dst) {
    await this.adbCmd(this.deviceId, `push "${src}" "${dst}"`);
  }

  async pull(src, dst = '') {
    await this.adbCmd(this.deviceId, `pull "${src}" "${dst}"`);
  }

  async rm(path, force = false) {
    await this.shell(`rm ${force ? '-f' : ''} "${path}"`);
  }

  /***
   * @returns {ChildProcessPromise}
   */
  spawnInstrumentation(userArgs, testRunner) {
    const spawnArgs = ['shell', 'am', 'instrument', '-w', '-r', ...userArgs, testRunner];
    return this.spawn(this.deviceId, spawnArgs, { detached: false });
  }

  async listInstrumentation() {
    return this.shell('pm list instrumentation');
  }

  async getInstrumentationRunner(bundleId) {
    const instrumentationRunners = await this.listInstrumentation();
    const instrumentationRunner = this._instrumentationRunnerForBundleId(instrumentationRunners, bundleId);
    if (instrumentationRunner === 'undefined') {
      throw new DetoxRuntimeError(`No instrumentation runner found on device ${this.deviceId} for package ${bundleId}`);
    }

    return instrumentationRunner;
  }

  _instrumentationRunnerForBundleId(instrumentationRunners, bundleId) {
    const runnerForBundleRegEx = new RegExp(`^instrumentation:(.*) \\(target=${bundleId.replace(new RegExp('\\.', 'g'), '\\.')}\\)$`, 'gm');
    return _.get(runnerForBundleRegEx.exec(instrumentationRunners), [1], 'undefined');
  }

  async shell(command, options) {
    const result = await this.adbCmd(this.deviceId, `shell "${escape.inQuotedString(command)}"`, options);
    return result.stdout.trim();
  }

  async shellSpawned(command, options) {
    const _command = `shell ${command}`;
    const result = await this.adbCmdSpawned(this.deviceId, _command, options);
    return result.stdout.trim();
  }

  async emu(cmd, options) {
    return (await this.adbCmd(this.deviceId, `emu "${escape.inQuotedString(cmd)}"`, options)).stdout.trim();
  }

  async reverse(port) {
    await this.adbCmd(this.deviceId, `reverse tcp:${port} tcp:${port}`);
  }

  async reverseRemove(port) {
    await this.adbCmd(this.deviceId, `reverse --remove tcp:${port}`);
  }

  async reverseList() {
    const { stdout } = await this.adbCmd(this.deviceId, `reverse --list`);
  }

  async emuKill() {
    return this.adbCmd(this.deviceId, `emu kill`);
  }

  async adbCmd(deviceId, params, options = {}) {
    const serial = `${deviceId ? `-s ${deviceId}` : ''}`;
    const cmd = `"${this.adbBin}" ${serial} ${params}`;
    const _options = {
      ...this.defaultExecOptions,
      ...options,
    };
    return execWithRetriesAndLogs(cmd, _options);
  }

  async adbCmdSpawned(deviceId, command, spawnOptions = {}) {
    const flags = command.split(/\s+/);
    const serial = deviceId ? ['-s', deviceId] : [];
    const _flags = [...serial, ...flags];
    const _spawnOptions = {
      ...this.defaultExecOptions,
      ...spawnOptions,
      capture: ['stdout'],
      encoding: 'utf8',
    };
    return spawnWithRetriesAndLogs(this.adbBin, _flags, _spawnOptions);
  }

  /***
   * @returns {ChildProcessPromise}
   */
  spawn(deviceId, params, spawnOptions) {
    const serial = deviceId ? ['-s', deviceId] : [];
    return spawnAndLog(this.adbBin, [...serial, ...params], spawnOptions);
  }
}

module.exports = ADB;
