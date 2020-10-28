const _ = require('lodash');
const path = require('path');
const {joinArgs} = require('../../../../utils/argparse');
const exec = require('../../../../utils/exec');
const log = require('../../../../utils/logger').child({ __filename });
const environment = require('../../../../utils/environment');

class AppleSimUtils {
  async setPermissions(udid, bundleId, permissionsObj) {
    let permissions = [];
    _.forEach(permissionsObj, function (shouldAllow, permission) {
      permissions.push(permission + '=' + shouldAllow);
    });

    const options = {
      args: `--byId ${udid} --bundle ${bundleId} --restartSB --setPermissions ${_.join(permissions, ',')}`,
      statusLogs: {
        trying: `Trying to set permissions...`,
        successful: 'Permissions are set'
      },
      retries: 1,
    }
    await this._execAppleSimUtils(options);
  }

  async list(query, listOptions = {}) {
    const options = {
      args: `--list ${joinArgs(query)}`,
      retries: 1,
      statusLogs: listOptions.trying ? { trying: listOptions.trying } : undefined,
    };
    const response = await this._execAppleSimUtils(options);
    const parsed = this._parseResponseFromAppleSimUtils(response);
    return parsed;
  }

  /***
   * Boots the simulator if it is not booted already.
   *
   * @param {String} udid - device id
   * @returns {Promise<boolean>} true, if device has been booted up from the shutdown state
   */
  async boot(udid, deviceLaunchArgs = '') {
    const isBooted = await this.isBooted(udid);

    if (!isBooted) {
      const statusLogs = { trying: `Booting device ${udid}...` };
      await this._execSimctl({ cmd: `boot ${udid} ${deviceLaunchArgs}`, statusLogs, retries: 10 });
      await this._execSimctl({ cmd: `bootstatus ${udid}`, retries: 1 });
      return true;
    }

    return false;
  }

  async isBooted(udid) {
    const device = await this._findDeviceByUDID(udid);
    return (_.isEqual(device.state, 'Booted') || _.isEqual(device.state, 'Booting'));
  }

  async _findDeviceByUDID(udid) {
    const [device] = await this.list({ byId: udid, maxResults: 1 });
    if (!device) {
      throw new Error(`Can't find device with UDID = "${udid}"`);
    }

    return device;
  }

  /***
   * @param deviceInfo - an item in output of `applesimutils --list`
   * @returns {Promise<string>} UDID of a new device
   */
  async create(deviceInfo) {
    const deviceName = _.get(deviceInfo, 'name');
    const deviceTypeIdentifier = _.get(deviceInfo, 'deviceType.identifier');
    const deviceRuntimeIdentifier = _.get(deviceInfo, 'os.identifier');

    if (!deviceTypeIdentifier || !deviceRuntimeIdentifier) {
      const deviceInfoStr = JSON.stringify(deviceInfo, null, 4);
      throw new Error(`Unable to create device from: ${deviceInfoStr}`);
    }

    const { stdout: udid } = await this._execSimctl({
      cmd: `create "${deviceName}-Detox" "${deviceTypeIdentifier}" "${deviceRuntimeIdentifier}"`
    });

    return (udid || '').trim();
  }

  async install(udid, absPath) {
    const statusLogs = {
      trying: `Installing ${absPath}...`,
      successful: `${absPath} installed`
    };
    await this._execSimctl({ cmd: `install ${udid} "${absPath}"`, statusLogs, retries: 2 });
  }

  async uninstall(udid, bundleId) {
    const statusLogs = {
      trying: `Uninstalling ${bundleId}...`,
      successful: `${bundleId} uninstalled`
    };
    try {
      await this._execSimctl({ cmd: `uninstall ${udid} ${bundleId}`, statusLogs });
    } catch (e) {
      // that's fine
    }
  }

  async launch(udid, bundleId, launchArgs, languageAndLocale) {
    const frameworkPath = await environment.getFrameworkPath();
    const result = await this._launchMagically(frameworkPath, udid, bundleId, launchArgs, languageAndLocale);
    await this._printLoggingHint(udid, bundleId);

    return this._parseLaunchId(result);
  }

  async sendToHome(udid) {
    await this._execSimctl({ cmd: `launch ${udid} com.apple.springboard`, retries: 10 });
  }

  async matchBiometric(udid, matchType) {
    if (!_.includes(['Face', 'Finger'], matchType)) {
      return;
    }

    const options = {
      args: `--byId ${udid} --match${matchType}`,
      retries: 1,
      statusLogs: {
        trying: `Trying to match ${matchType}...`,
        successful: `Matched ${matchType}!`
      },
    };
    await this._execAppleSimUtils(options);
  }

  async unmatchBiometric(udid, matchType) {
    if (!_.includes(['Face', 'Finger'], matchType)) {
      return;
    }

    const options = {
      args: `--byId ${udid} --unmatch${matchType}`,
      retries: 1,
      statusLogs: {
        trying: `Trying to unmatch ${matchType}...`,
        successful: `Unmatched ${matchType}!`
      },
    }
    await this._execAppleSimUtils(options);
  }

  async setBiometricEnrollment(udid, yesOrNo) {
    if (!_.includes(['YES', 'NO'], yesOrNo)) {
      return;
    }

    const toggle = yesOrNo === 'YES';
    const options = {
      args: `--byId ${udid} --biometricEnrollment ${yesOrNo}`,
      retries: 1,
      statusLogs: {
        trying: `Turning ${toggle ? 'on' : 'off'} biometric enrollment...`,
        successful: toggle ? 'Activated!' : 'Deactivated!'
      },
    }
    await this._execAppleSimUtils(options);
  }

  async clearKeychain(udid) {
    const options = {
      args: `--byId ${udid} --clearKeychain`,
      retries: 1,
      statusLogs: {
        trying: `Clearing Keychain...`,
        successful: 'Cleared Keychain!'
      },
    }
    await this._execAppleSimUtils(options);
  }

  async getAppContainer(udid, bundleId) {
    return _.trim((await this._execSimctl({ cmd: `get_app_container ${udid} ${bundleId}` })).stdout);
  }

  logStream({ udid, stdout, level, processImagePath, style }) {
    const args = ['simctl', 'spawn', udid, 'log', 'stream'];

    if (level) {
      args.push('--level');
      args.push(level);
    }

    if (style) {
      args.push('--style');
      args.push(style);
    }

    if (processImagePath) {
      args.push('--predicate');
      args.push(`processImagePath beginsWith "${processImagePath}"`);
    }

    const promise = exec.spawnAndLog('/usr/bin/xcrun', args, {
      stdio: ['ignore', stdout, 'ignore'],
      silent: true,
    });

    return promise;
  }

  async terminate(udid, bundleId) {
    const statusLogs = {
      trying: `Terminating ${bundleId}...`,
      successful: `${bundleId} terminated`
    };
    await this._execSimctl({ cmd: `terminate ${udid} ${bundleId}`, statusLogs });
  }

  async shutdown(udid) {
    const statusLogs = {
      trying: `Shutting down ${udid}...`,
      successful: `${udid} shut down`
    };
    await this._execSimctl({ cmd: `shutdown ${udid}`, statusLogs });
  }

  async openUrl(udid, url) {
    await this._execSimctl({ cmd: `openurl ${udid} ${url}` });
  }

  async setLocation(udid, lat, lon) {
    const result = await exec.execWithRetriesAndLogs(`which fbsimctl`, { retries: 1 });
    if (_.get(result, 'stdout')) {
      await exec.execWithRetriesAndLogs(`fbsimctl ${udid} set_location ${lat} ${lon}`, { retries: 1 });
    } else {
      throw new Error(`setLocation currently supported only through fbsimctl.
      Install fbsimctl using:
      "brew tap facebook/fb && export CODE_SIGNING_REQUIRED=NO && brew install fbsimctl"`);
    }
  }

  async resetContentAndSettings(udid) {
    await this._execSimctl({ cmd: `erase ${udid}` });
  }

  async takeScreenshot(udid, destination) {
    await this._execSimctl({
      cmd: `io ${udid} screenshot "${destination}"`,
      silent: destination === '/dev/null',
    });
  }

  recordVideo(udid, destination, options = {}) {
    const args = ['simctl', 'io', udid, 'recordVideo', destination];
    if (options.codec) {
      args.push('--codec');
      args.push(options.codec);
    }
    return exec.spawnAndLog('/usr/bin/xcrun', args);
  }

  async _execAppleSimUtils(options) {
    const bin = `applesimutils`;
    return await exec.execWithRetriesAndLogs(bin, options);
  }

  async _execSimctl({ cmd, statusLogs = {}, retries = 1, silent = false }) {
    const options = {
      verbosity: silent ? 'low' : 'normal',
      statusLogs,
      retries,
    }
    return await exec.execWithRetriesAndLogs(`/usr/bin/xcrun simctl ${cmd}`, options);
  }

  _parseResponseFromAppleSimUtils(response) {
    let out = _.get(response, 'stdout');
    if (_.isEmpty(out)) {
      out = _.get(response, 'stderr');
    }
    if (_.isEmpty(out)) {
      return undefined;
    }

    let parsed;
    try {
      parsed = JSON.parse(out);

    } catch (ex) {
      throw new Error(`Could not parse response from applesimutils, please update applesimutils and try again.
      'brew uninstall applesimutils && brew tap wix/brew && brew install applesimutils'`);
    }
    return parsed;
  }

  _joinLaunchArgs(launchArgs) {
    return _.map(launchArgs, (v, k) => `-${k} "${v}"`).join(' ').trim();
  }

  async _launchMagically(frameworkPath, udid, bundleId, launchArgs, languageAndLocale) {
    const args = this._joinLaunchArgs(launchArgs);

    let dylibs = `${frameworkPath}/Detox`;
    if (process.env.SIMCTL_CHILD_DYLD_INSERT_LIBRARIES) {
      dylibs = `${process.env.SIMCTL_CHILD_DYLD_INSERT_LIBRARIES}:${dylibs}`;
    }

    let launchBin = `SIMCTL_CHILD_DYLD_INSERT_LIBRARIES="${dylibs}" ` +
      `/usr/bin/xcrun simctl launch ${udid} ${bundleId} --args ${args}`;

      if (!!languageAndLocale && !!languageAndLocale.language) {
        launchBin += ` -AppleLanguages "(${languageAndLocale.language})"`;
      }

      if (!!languageAndLocale && !!languageAndLocale.locale) {
        launchBin += ` -AppleLocale ${languageAndLocale.locale}`;
      }

    const options = {
      retries: 1,
      statusLogs: {
        trying: `Launching ${bundleId}...`,
      },
    };
    const result = await exec.execWithRetriesAndLogs(launchBin, options);
    return result;
  }

  async _printLoggingHint(udid, bundleId) {
    const appContainer = await this.getAppContainer(udid, bundleId);
    const CFBundleExecutable = await exec.execAsync(`/usr/libexec/PlistBuddy -c "Print CFBundleExecutable" "${path.join(appContainer, 'Info.plist')}"`);
    const predicate = `process == "${CFBundleExecutable}"`;
    const command = `/usr/bin/xcrun simctl spawn ${udid} log stream --level debug --style compact --predicate '${predicate}'`;

    log.info(`${bundleId} launched. To watch simulator logs, run:\n        ${command}`);
  }

  _parseLaunchId(result) {
    return parseInt(_.get(result, 'stdout', ':').trim().split(':')[1]);
  }

  async statusBarOverride(udid, flags) {
    if (udid && flags) {
      let overrides = [];
      if (flags.time)
        overrides.push(`--time "${flags.time}"`)
      if (flags.dataNetwork)
        overrides.push(`--dataNetwork "${flags.dataNetwork}"`)
      if (flags.wifiMode)
        overrides.push(`--wifiMode "${flags.wifiMode}"`)
      if (flags.wifiBars)
        overrides.push(`--wifiBars "${flags.wifiBars}"`)
      if (flags.cellularMode)
        overrides.push(`--cellularMode "${flags.cellularMode}"`)
      if (flags.cellularBars)
        overrides.push(`--cellularBars "${flags.cellularBars}"`)
      if (flags.batteryState)
        overrides.push(`--batteryState "${flags.batteryState}"`)
      if (flags.batteryLevel)
        overrides.push(`--batteryLevel "${flags.batteryLevel}"`)

      await this._execSimctl({ cmd: `status_bar ${udid} override ${overrides.join(' ')}` });
    }
  }

  async statusBarReset(udid) {
    await this._execSimctl({ cmd: `status_bar ${udid} clear` });
  }
}

module.exports = AppleSimUtils;
