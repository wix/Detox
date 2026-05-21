// @ts-nocheck
const _ = require('lodash');

const DetoxRuntimeError = require('../../../../../errors/DetoxRuntimeError');
const { execWithRetriesAndLogs, spawnWithRetriesAndLogs, spawnAndLog } = require('../../../../../utils/childProcess');
const { getAdbPath } = require('../../../../../utils/environment');
const logger = require('../../../../../utils/logger');
const { escape } = require('../../../../../utils/pipeCommands');
const retry = require('../../../../../utils/retry');
const DeviceHandle = require('../tools/DeviceHandle');
const EmulatorHandle = require('../tools/EmulatorHandle');

const log = logger.child({ cat: 'device' });

const DEFAULT_EXEC_OPTIONS = {
  retries: 1,
};
const DEFAULT_INSTALL_OPTIONS = {
  timeout: 60000,
  retries: 3,
};

const ENROLLED_FINGER_ID = 1;
const UNENROLLED_FINGER_ID = 99;
const DEFAULT_BIOMETRIC_PIN = '0000';
const ENROLLED_FACE_HIT = 1;
const UNENROLLED_FACE_HIT = 2;
const BOOT_WAIT_RETRIES = 240;
const BOOT_WAIT_INTERVAL_MS = 2500;

class ADB {
  constructor() {
    this._cachedApiLevels = new Map();
    this.defaultExecOptions = DEFAULT_EXEC_OPTIONS;
    this.installOptions = DEFAULT_INSTALL_OPTIONS;
    this.adbBin = getAdbPath();
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

  async root(deviceId) {
    await this.adbCmd(deviceId, 'root');
    await this.adbCmd(deviceId, 'wait-for-device');
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

  async install(deviceId, _apkPath) {
    const apkPath = escape.inQuotedString(_apkPath);
    const apiLvl = await this.apiLevel(deviceId);
    const command = (apiLvl >= 23)
      ? `install -r -g -t ${apkPath}`
      : `install -rg ${apkPath}`;
    const result = await this.adbCmdSpawned(deviceId, command, this.installOptions);

    const [failure] = (result.stdout || '').match(/^Failure \[.*\]$/m) || [];
    if (failure) {
      throw new DetoxRuntimeError({
        message: `Failed to install app on ${deviceId}: ${apkPath}`,
        debugInfo: failure,
      });
    }
  }

  async remoteInstall(deviceId, path) {
    const apiLvl = await this.apiLevel(deviceId);
    const command = (apiLvl >= 23)
      ? `pm install -r -g -t ${path}`
      : `pm install -rg ${path}`;
    return this.shellSpawned(deviceId, command, this.installOptions);
  }

  async uninstall(deviceId, appId) {
    await this.adbCmd(deviceId, `uninstall ${appId}`);
  }

  async terminate(deviceId, appId) {
    await this.shell(deviceId, `am force-stop ${appId}`);
  }

  async clearAppData(deviceId, packageId) {
    try {
      return await this.shell(deviceId, `pm clear ${packageId}`);
    } catch (reason) {
      throw new DetoxRuntimeError({
        message: `Failed to clear ${packageId} app data on ${deviceId}`,
        hint: `Please verify that the package is installed on the device:\nadb -s ${deviceId} shell pm list packages ${packageId}`,
        debugInfo: reason,
      });
    }
  }

  async grantAllPermissions(deviceId, packageId) {
    try {
      await this.shell(deviceId, `pm grant --all-permissions ${packageId}`);
    } catch (e) {
      const message = e.stderr || e.message || '';
      if (message.includes('no permission specified')) {
        log.warn(
          `Cannot restore permissions after resetAppState(). Please update Android version to API 35 or higher.`
        );
      } else {
        throw e;
      }
    }
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
    // which will obviously fail.
    //
    // Since `adb emu` commands fail silently, .catch() is not necessary.

    const dot = `${lon} ${lat}`;
    const comma = dot.replace(/\./g, ',');

    await this.emu(deviceId, `geo fix ${dot}`);
    await this.emu(deviceId, `geo fix ${comma}`);
  }

  async pidof(deviceId, bundleId) {
    const bundleIdRegex = escape.inQuotedRegexp(bundleId) + '$';
    const command = `ps | grep "${bundleIdRegex}"`;
    const options = { silent: true };

    const processes = await this.shell(deviceId, command, options).catch(() => '');
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
      const bootComplete = await this.shell(deviceId, `getprop dev.bootcomplete`, { retries: 0, silent: true });
      return (bootComplete === '1');
    } catch (ex) {
      return false;
    }
  }

  async waitForDevice(deviceId) {
    return await this.adbCmd(deviceId, 'wait-for-device');
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

  async setWiFiToggle(deviceId, state) {
    const value = (state === true ? 'enable' : 'disable');
    await this.shell(deviceId, `svc wifi ${value}`);
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

  async shell(deviceId, command, options) {
    const result = await this.adbCmd(deviceId, `shell "${escape.inQuotedString(command)}"`, options);
    return result.stdout.trim();
  }

  async shellSpawned(deviceId, command, options) {
    const _command = `shell ${command}`;
    const result = await this.adbCmdSpawned(deviceId, _command, options);
    return result.stdout.trim();
  }

  async emu(deviceId, cmd, options) {
    return (await this.adbCmd(deviceId, `emu "${escape.inQuotedString(cmd)}"`, options)).stdout.trim();
  }

  async matchFinger(deviceId) {
    await this.emu(deviceId, `finger touch ${ENROLLED_FINGER_ID}`);
    await this.emu(deviceId, `finger remove`);
  }

  async unmatchFinger(deviceId) {
    await this.emu(deviceId, `finger touch ${UNENROLLED_FINGER_ID}`);
    await this.emu(deviceId, `finger remove`);
  }

  async setBiometricEnrollment(deviceId, enabled) {
    await this.root(deviceId);
    if (enabled) {
      await this.shell(deviceId, `locksettings clear --old ${DEFAULT_BIOMETRIC_PIN}`).catch(() => {});
      await this.shell(deviceId, `locksettings set-pin ${DEFAULT_BIOMETRIC_PIN}`);
      await this.shell(deviceId, `setprop persist.vendor.fingerprint.virtual.enrollments 1`);
      await this.shell(deviceId, `cmd fingerprint sync`);
    } else {
      await this.shell(deviceId, `cmd fingerprint sync`);
      await this.shell(deviceId, `setprop persist.vendor.fingerprint.virtual.enrollments 0`);
      await this.shell(deviceId, `locksettings clear --old ${DEFAULT_BIOMETRIC_PIN}`).catch(() => {});
    }
  }

  async setFaceEnrollment(deviceId, enabled) {
    await this.root(deviceId);
    if (enabled) {
      const alreadyActive = await this._isFaceVirtualHalActive(deviceId);
      if (!alreadyActive) {
        await this.shell(deviceId, `device_config set_sync_disabled_for_tests persistent`).catch(() => {});
        await this.shell(deviceId, `device_config put biometrics_framework com.android.server.biometrics.face_vhal_feature true`);
        await this.shell(deviceId, `settings put secure biometric_virtual_enabled 1`);
        await this.shell(deviceId, `setprop persist.vendor.face.virtual.strength strong`);
        await this.shell(deviceId, `setprop persist.vendor.face.virtual.type RGB`);
        const reverses = await this._listReverses(deviceId);
        await this.reboot(deviceId);
        await this.root(deviceId);
        await this._restoreReverses(deviceId, reverses);
      }
      await this.shell(deviceId, `locksettings clear --old ${DEFAULT_BIOMETRIC_PIN}`).catch(() => {});
      await this.shell(deviceId, `locksettings set-pin ${DEFAULT_BIOMETRIC_PIN}`);
      await this.shell(deviceId, `setprop persist.vendor.face.virtual.enrollments 1`);
      await this.shell(deviceId, `cmd face sync`);
    } else {
      await this.shell(deviceId, `cmd face sync`).catch(() => {});
      await this.shell(deviceId, `setprop persist.vendor.face.virtual.enrollments 0`);
      await this.shell(deviceId, `locksettings clear --old ${DEFAULT_BIOMETRIC_PIN}`).catch(() => {});
    }
  }

  async _isFaceVirtualHalActive(deviceId) {
    try {
      const virtualEnabled = await this.shell(deviceId, `settings get secure biometric_virtual_enabled`, { silent: true, retries: 0 });
      const featureFlag = await this.shell(deviceId, `device_config get biometrics_framework com.android.server.biometrics.face_vhal_feature`, { silent: true, retries: 0 });
      return String(virtualEnabled).trim() === '1' && String(featureFlag).trim() === 'true';
    } catch (_) {
      return false;
    }
  }

  async _listReverses(deviceId) {
    try {
      const { stdout } = await this.adbCmd(deviceId, 'reverse --list');
      return (stdout || '')
        .split('\n')
        .map(line => line.match(/(tcp:\d+)\s+(tcp:\d+)/))
        .filter(Boolean)
        .map(m => ({ local: m[1], remote: m[2] }));
    } catch (_) {
      return [];
    }
  }

  async _restoreReverses(deviceId, reverses) {
    for (const { local, remote } of reverses) {
      await this.adbCmd(deviceId, `reverse ${local} ${remote}`).catch(() => {});
    }
  }

  async matchFace(deviceId) {
    await this.root(deviceId);
    await this.shell(deviceId, `setprop vendor.face.virtual.enrollment_hit ${ENROLLED_FACE_HIT}`);
  }

  async unmatchFace(deviceId) {
    await this.root(deviceId);
    await this.shell(deviceId, `setprop vendor.face.virtual.enrollment_hit ${UNENROLLED_FACE_HIT}`);
  }

  async reboot(deviceId) {
    await this.adbCmd(deviceId, 'reboot');
    await this.adbCmd(deviceId, 'wait-for-device');
    await this._waitForBootComplete(deviceId);
  }

  async _waitForBootComplete(deviceId) {
    await retry({ retries: BOOT_WAIT_RETRIES, interval: BOOT_WAIT_INTERVAL_MS, shouldUnref: true }, async () => {
      if (!await this.isBootComplete(deviceId)) {
        throw new DetoxRuntimeError({
          message: `Waited for ${deviceId} to complete booting for too long!`,
        });
      }
    });
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
