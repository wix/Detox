const _ = require('lodash');
const exec = require('../../utils/exec');
const log = require('../../utils/logger').child({ __filename });
const environment = require('../../utils/environment');

class AppleSimUtils {
  async setPermissions(udid, bundleId, permissionsObj) {
    const statusLogs = {
      trying: `Trying to set permissions...`,
      successful: 'Permissions are set'
    };
    let permissions = [];
    _.forEach(permissionsObj, function (shouldAllow, permission) {
      permissions.push(permission + '=' + shouldAllow);
    });
    await this._execAppleSimUtils({
      args: `--byId ${udid} --bundle ${bundleId} --restartSB --setPermissions ${_.join(permissions, ',')}`
    }, statusLogs, 1);
  }

  async findDeviceUDID(query) {
    const udids = await this.findDevicesUDID(query);
    return udids[0];
  }

  async findDevicesUDID(query) {
    const statusLogs = {
      trying: `Searching for device matching ${query}...`
    };

    let type;
    let os;
    if (_.includes(query, ',')) {
      const parts = _.split(query, ',');
      type = parts[0].trim();
      os = parts[1].trim();
    } else {
      type = query;
      const deviceInfo = await this.deviceTypeAndNewestRuntimeFor(query);
      os = deviceInfo.newestRuntime.version;
    }

    const response = await this._execAppleSimUtils({ args: `--list --byType "${type}" --byOS "${os}"`}, statusLogs, 1);
    const parsed = this._parseResponseFromAppleSimUtils(response);
    const udids = _.map(parsed, 'udid');
    if (!udids || !udids.length || !udids[0]) {
      throw new Error(`Can't find a simulator to match with "${query}", run 'xcrun simctl list' to list your supported devices.
      It is advised to only state a device type, and not to state iOS version, e.g. "iPhone 7"`);
    }
    return udids;
  }

  async findDeviceByUDID(udid) {
    const response = await this._execAppleSimUtils({args: `--list --byId "${udid}"`}, undefined, 1);
    const parsed = this._parseResponseFromAppleSimUtils(response);
    const device = _.find(parsed, (device) => _.isEqual(device.udid, udid));
    if (!device) {
      throw new Error(`Can't find device ${udid}`);
    }
    return device;
  }

  /***
   * Boots the simulator if it is not booted already.
   *
   * @param {String} udid - device id
   * @returns {Promise<boolean>} true, if device has been booted up from the shutdown state
   */
  async boot(udid) {
    const isBooted = await this.isBooted(udid);

    if (!isBooted) {
      const statusLogs = { trying: `Booting device ${udid}` };
      await this._execSimctl({ cmd: `boot ${udid}`, statusLogs, retries: 10 });
      await this._execSimctl({ cmd: `bootstatus ${udid}`, retries: 1 });
      return true;
    }

    return false;
  }

  async isBooted(udid) {
    const device = await this.findDeviceByUDID(udid);
    return (_.isEqual(device.state, 'Booted') || _.isEqual(device.state, 'Booting'));
  }

  async deviceTypeAndNewestRuntimeFor(name) {
    const result = await this._execSimctl({ cmd: `list -j` });
    const stdout = _.get(result, 'stdout');
    const output = JSON.parse(stdout);
    const deviceType = _.filter(output.devicetypes, { 'name': name})[0];
    const newestRuntime = _.maxBy(output.runtimes, r => Number(r.version));
    return { deviceType, newestRuntime };
  }

  async create(name) {
    const deviceInfo = await this.deviceTypeAndNewestRuntimeFor(name);

    if (deviceInfo.newestRuntime) {
      const result = await this._execSimctl({cmd: `create "${name}-Detox" "${deviceInfo.deviceType.identifier}" "${deviceInfo.newestRuntime.identifier}"`});
      const udid = _.get(result, 'stdout').trim();
      return udid;
    } else {
      throw new Error(`Unable to create device. No runtime found for ${name}`);
    }
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
    const result = await exec.execWithRetriesAndLogs(`which fbsimctl`, undefined, undefined, 1);
    if (_.get(result, 'stdout')) {
      await exec.execWithRetriesAndLogs(`fbsimctl ${udid} set_location ${lat} ${lon}`, undefined, undefined, 1);
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

  recordVideo(udid, destination) {
    return exec.spawnAndLog('/usr/bin/xcrun', ['simctl', 'io', udid, 'recordVideo', destination]);
  }

  async _execAppleSimUtils(options, statusLogs, retries, interval) {
    const bin = `applesimutils`;
    return await exec.execWithRetriesAndLogs(bin, options, statusLogs, retries, interval);
  }

  async _execSimctl({ cmd, statusLogs = {}, retries = 1, silent = false }) {
    return await exec.execWithRetriesAndLogs(`/usr/bin/xcrun simctl ${cmd}`, { silent }, statusLogs, retries);
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

    const statusLogs = {
      trying: `Launching ${bundleId}...`,
    };

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

    const result = await exec.execWithRetriesAndLogs(launchBin, undefined, statusLogs, 1);

    return result;
  }

  async _printLoggingHint(udid, bundleId) {
    const appContainer = await this.getAppContainer(udid, bundleId);
    const predicate = `processImagePath beginsWith "${appContainer}"`;
    const command = `/usr/bin/xcrun simctl spawn ${udid} log stream --level debug --style compact --predicate '${predicate}'`;

    log.info(`${bundleId} launched. To watch simulator logs, run:\n        ${command}`);
  }

  _parseLaunchId(result) {
    return parseInt(_.get(result, 'stdout', ':').trim().split(':')[1]);
  }
}

module.exports = AppleSimUtils;
