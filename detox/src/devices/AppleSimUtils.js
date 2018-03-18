const _ = require('lodash');
const exec = require('../utils/exec');
const retry = require('../utils/retry');
const environment = require('../utils/environment');

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
      args: `--simulator ${udid} --bundle ${bundleId} --setPermissions ${_.join(permissions, ',')}`
    }, statusLogs, 1);
  }

  async findDeviceUDID(query) {
    const statusLogs = {
      trying: `Searching for device matching ${query}...`
    };
    let correctQuery = this._correctQueryWithOS(query);
    const response = await this._execAppleSimUtils({ args: `--list "${correctQuery}" --maxResults=1` }, statusLogs, 1);
    const parsed = this._parseResponseFromAppleSimUtils(response);
    const udid = _.get(parsed, [0, 'udid']);
    if (!udid) {
      throw new Error(`Can't find a simulator to match with "${query}", run 'xcrun simctl list' to list your supported devices.
      It is advised to only state a device type, and not to state iOS version, e.g. "iPhone 7"`);
    }
    return udid;
  }

  async findDeviceByUDID(udid) {
    const response = await this._execAppleSimUtils({ args: `--list` }, undefined, 1);
    const parsed = this._parseResponseFromAppleSimUtils(response);
    const device = _.find(parsed, (device) => _.isEqual(device.udid, udid));
    if (!device) {
      throw new Error(`Can't find device ${udid}`);
    }
    return device;
  }

  async waitForDeviceState(udid, state) {
    let device;
    await retry({ retries: 10, interval: 1000 }, async () => {
      device = await this.findDeviceByUDID(udid);
      if (!_.isEqual(device.state, state)) {
        throw new Error(`device is in state '${device.state}'`);
      }
    });
    return device;
  }

  async boot(udid) {
    const device = await this.findDeviceByUDID(udid);
    if (_.isEqual(device.state, 'Booted') || _.isEqual(device.state, 'Booting')) {
      return false;
    }
    await this.waitForDeviceState(udid, 'Shutdown');
    await this._bootDeviceByXcodeVersion(udid);
    await this.waitForDeviceState(udid, 'Booted');
  }

  async install(udid, absPath) {
    const statusLogs = {
      trying: `Installing ${absPath}...`,
      successful: `${absPath} installed`
    };
    await this._execSimctl({ cmd: `install ${udid} "${absPath}"`, statusLogs });
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

  async launch(udid, bundleId, launchArgs) {
    const frameworkPath = await environment.getFrameworkPath();
    const logsInfo = new LogsInfo(udid);
    const args = this._joinLaunchArgs(launchArgs);

    const result = await this._launchMagically(frameworkPath, logsInfo, udid, bundleId, args);
    return this._parseLaunchId(result);
  }

  async sendToHome(udid) {
    await this._execSimctl({ cmd: `launch ${udid} com.apple.springboard`, retries: 10 });
  }

  getLogsPaths(udid) {
    const logsInfo = new LogsInfo(udid);
    return {
      stdout: logsInfo.absStdout,
      stderr: logsInfo.absStderr
    }
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
    await this.shutdown(udid);
    await this._execSimctl({ cmd: `erase ${udid}` });
    await this.boot(udid);
  }

  async getXcodeVersion() {
    const raw = await exec.execWithRetriesAndLogs(`xcodebuild -version`, undefined, undefined, 1);
    const stdout = _.get(raw, 'stdout', 'undefined');
    const match = /^Xcode (\S+)\.*\S*\s*/.exec(stdout);
    const majorVersion = parseInt(_.get(match, '[1]'));
    if (!_.isInteger(majorVersion) || majorVersion < 1) {
      throw new Error(`Can't read Xcode version, got: '${stdout}'`);
    }
    return majorVersion;
  }

  async _execAppleSimUtils(options, statusLogs, retries, interval) {
    const bin = `applesimutils`;
    return await exec.execWithRetriesAndLogs(bin, options, statusLogs, retries, interval);
  }

  async _execSimctl({ cmd, statusLogs = {}, retries = 1 }) {
    return await exec.execWithRetriesAndLogs(`/usr/bin/xcrun simctl ${cmd}`, undefined, statusLogs, retries);
  }

  _correctQueryWithOS(query) {
    let correctQuery = query;
    if (_.includes(query, ',')) {
      const parts = _.split(query, ',');
      correctQuery = `${parts[0].trim()}, OS=${parts[1].trim()}`;
    }
    return correctQuery;
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

  async _bootDeviceByXcodeVersion(udid) {
    const xcodeVersion = await this.getXcodeVersion();
    if (xcodeVersion >= 9) {
      const statusLogs = { trying: `Booting device ${udid}` };
      await this._execSimctl({ cmd: `boot ${udid}`, statusLogs, retries: 10 });
    } else {
      await this._bootDeviceMagically(udid);
    }
  }

  async _bootDeviceMagically(udid) {
    const cmd = "/bin/bash -c '`xcode-select -p`/Applications/Simulator.app/Contents/MacOS/Simulator " +
      `--args -CurrentDeviceUDID ${udid} -ConnectHardwareKeyboard 0 ` +
      "-DeviceSetPath $HOME/Library/Developer/CoreSimulator/Devices > /dev/null 2>&1 < /dev/null &'";
    await exec.execWithRetriesAndLogs(cmd, undefined, { trying: `Launching device ${udid}...` }, 1);
  }

  _joinLaunchArgs(launchArgs) {
    return _.map(launchArgs, (v, k) => `${k} ${v}`).join(' ').trim();
  }

  async _launchMagically(frameworkPath, logsInfo, udid, bundleId, args) {
    const statusLogs = {
      trying: `Launching ${bundleId}...`,
      successful: `${bundleId} launched. The stdout and stderr logs were recreated, you can watch them with:\n` +
      `        tail -F ${logsInfo.absJoined}`
    };

    const launchBin = `/bin/cat /dev/null >${logsInfo.absStdout} 2>${logsInfo.absStderr} && ` +
      `SIMCTL_CHILD_DYLD_INSERT_LIBRARIES="${frameworkPath}/Detox" ` +
      `/usr/bin/xcrun simctl launch --stdout=${logsInfo.simStdout} --stderr=${logsInfo.simStderr} ` +
      `${udid} ${bundleId} --args ${args}`;

    return await exec.execWithRetriesAndLogs(launchBin, undefined, statusLogs, 1);
  }

  _parseLaunchId(result) {
    return parseInt(_.get(result, 'stdout', ':').trim().split(':')[1]);
  }
}

class LogsInfo {
  constructor(udid) {
    const logPrefix = '/tmp/detox.last_launch_app_log.';
    this.simStdout = logPrefix + 'out';
    this.simStderr = logPrefix + 'err';
    const simDataRoot = `$HOME/Library/Developer/CoreSimulator/Devices/${udid}/data`;
    this.absStdout = simDataRoot + this.simStdout;
    this.absStderr = simDataRoot + this.simStderr;
    this.absJoined = `${simDataRoot}${logPrefix}{out,err}`
  }
}

module.exports = AppleSimUtils;
