const _ = require('lodash');

const DetoxRuntimeError = require('../../../../../errors/DetoxRuntimeError');
const { getAdbPath } = require('../../../../../utils/environment');
const { execWithRetriesAndLogs, spawnAndLog } = require('../../../../../utils/exec');
const { escape } = require('../../../../../utils/pipeCommands');
const DeviceHandle = require('../tools/DeviceHandle');
const EmulatorHandle = require('../tools/EmulatorHandle');

class ADB {
  constructor() {
    this._cachedApiLevels = new Map();
    this.adbBin = getAdbPath();
  }

  async devices() {
    const { stdout } = await this.adbCmd('', 'devices', { verbosity: 'high' });
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

  async getState(deviceId) {
    try {
      const output = await this.adbCmd(deviceId, `get-state`, {
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

  async typeText(deviceId, text) {
    const actualText = text.replace(/ /g, '%s');
    await this.shell(deviceId, `input text ${actualText}`);
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
    if (apiLvl >= 23) {
      childProcess = await this.adbCmd(deviceId, `install -r -g -t ${apkPath}`);
    } else {
      // NOTICE: MUST be in `-rg` form instead of individual `-g` form when API < 23
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

  async remoteInstall(deviceId, path) {
    const apiLvl = await this.apiLevel(deviceId);

    if (apiLvl >= 23) {
      return this.shell(deviceId, `pm install -r -g -t ${path}`);
    } else {
      // NOTICE: MUST be in `-rg` form instead of individual `-g` form when API < 23
      return this.shell(deviceId, `pm install -rg ${path}`);
    }
  }

  async uninstall(deviceId, appId) {
    await this.adbCmd(deviceId, `uninstall ${appId}`);
  }

  async terminate(deviceId, appId) {
    await this.shell(deviceId, `am force-stop ${appId}`);
  }

  async setLocation(deviceId, lat, lon) {
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
    // which will obviosuly fail.
    //
    // Since `adb emu` commands fail silently, .catch() is not necessary.

    const dot = `${lon} ${lat}`;
    const comma = dot.replace(/\./g, ',');

    await this.emu(deviceId, `geo fix ${dot}`);
    await this.emu(deviceId, `geo fix ${comma}`);
  }

  async pidof(deviceId, bundleId) {
    const bundleIdRegex = escape.inQuotedRegexp(bundleId) + '$';

    const processes = await this.shell(deviceId, `ps | grep "${bundleIdRegex}"`, { silent: true }).catch(() => '');
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

  async disableAndroidAnimations(deviceId) {
    await this.shell(deviceId, `settings put global animator_duration_scale 0`);
    await this.shell(deviceId, `settings put global window_animation_scale 0`);
    await this.shell(deviceId, `settings put global transition_animation_scale 0`);
  }

  async screencap(deviceId, path) {
    await this.shell(deviceId, `screencap ${path}`);
  }

  /***
   * @returns ChildProcessPromise
   */
  screenrecord(deviceId, { path, size, bitRate, timeLimit, verbose }) {
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

  async push(deviceId, src, dst) {
    await this.adbCmd(deviceId, `push "${src}" "${dst}"`);
  }

  async pull(deviceId, src, dst = '') {
    await this.adbCmd(deviceId, `pull "${src}" "${dst}"`);
  }

  async rm(deviceId, path, force = false) {
    await this.shell(deviceId, `rm ${force ? '-f' : ''} "${path}"`);
  }

  /***
   * @returns {ChildProcessPromise}
   */
  spawnInstrumentation(deviceId, userArgs, testRunner) {
    const spawnArgs = ['shell', 'am', 'instrument', '-w', '-r', ...userArgs, testRunner];
    return this.spawn(deviceId, spawnArgs, { detached: false });
  }

  async listInstrumentation(deviceId) {
    return this.shell(deviceId, 'pm list instrumentation');
  }

  async getInstrumentationRunner(deviceId, bundleId) {
    const instrumentationRunners = await this.listInstrumentation(deviceId);
    const instrumentationRunner = this._instrumentationRunnerForBundleId(instrumentationRunners, bundleId);
    if (instrumentationRunner === 'undefined') {
      throw new DetoxRuntimeError(`No instrumentation runner found on device ${deviceId} for package ${bundleId}`);
    }

    return instrumentationRunner;
  }

  _instrumentationRunnerForBundleId(instrumentationRunners, bundleId) {
    const runnerForBundleRegEx = new RegExp(`^instrumentation:(.*) \\(target=${bundleId.replace(new RegExp('\\.', 'g'), '\\.')}\\)$`, 'gm');
    return _.get(runnerForBundleRegEx.exec(instrumentationRunners), [1], 'undefined');
  }

  async shell(deviceId, cmd, options) {
    return (await this.adbCmd(deviceId, `shell "${escape.inQuotedString(cmd)}"`, options)).stdout.trim();
  }

  async emu(deviceId, cmd, options) {
    return (await this.adbCmd(deviceId, `emu "${escape.inQuotedString(cmd)}"`, options)).stdout.trim();
  }

  async reverse(deviceId, port) {
    return this.adbCmd(deviceId, `reverse tcp:${port} tcp:${port}`);
  }

  async reverseRemove(deviceId, port) {
    return this.adbCmd(deviceId, `reverse --remove tcp:${port}`);
  }

  async emuKill(deviceId) {
    return this.adbCmd(deviceId, `emu kill`);
  }

  // TODO refactor the whole thing so as to make usage of BinaryExec -- similar to EmulatorExec
  async adbCmd(deviceId, params, options = {}) {
    const serial = `${deviceId ? `-s ${deviceId}` : ''}`;
    const cmd = `"${this.adbBin}" ${serial} ${params}`;
    const _options = {
      retries: 1,
      ...options,
    };
    return execWithRetriesAndLogs(cmd, _options);
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
