const _ = require('lodash');
const exec = require('../utils/exec');
const retry = require('../utils/retry');

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
    const parsed = this._parseStdout(response);
    const udid = _.get(parsed, [0, 'udid']);
    if (!udid) {
      throw new Error(`Can't find a simulator to match with "${query}", run 'xcrun simctl list' to list your supported devices.
      It is advised to only state a device type, and not to state iOS version, e.g. "iPhone 7"`);
    }
    return udid;
  }

  async findDeviceByUDID(udid) {
    const response = await this._execAppleSimUtils({ args: `--list` }, undefined, 1);
    const parsed = this._parseStdout(response);
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
    await this._bootDeviceMagically(udid);
    await this.waitForDeviceState(udid, 'Booted');
  }

  async _execAppleSimUtils(options, statusLogs, retries, interval) {
    const bin = `applesimutils`;
    return await exec.execWithRetriesAndLogs(bin, options, statusLogs, retries, interval);
  }

  _correctQueryWithOS(query) {
    let correctQuery = query;
    if (_.includes(query, ',')) {
      const parts = _.split(query, ',');
      correctQuery = `${parts[0].trim()}, OS=${parts[1].trim()}`;
    }
    return correctQuery;
  }

  _parseStdout(response) {
    const stdout = _.get(response, 'stdout');
    if (_.isEmpty(stdout)) {
      return undefined;
    }
    return JSON.parse(stdout);
  }

  async _bootDeviceMagically(udid) {
    const cmd = "/bin/bash -c '`xcode-select -p`/Applications/Simulator.app/Contents/MacOS/Simulator " +
      `--args -CurrentDeviceUDID ${udid} -ConnectHardwareKeyboard 0 ` +
      "-DeviceSetPath $HOME/Library/Developer/CoreSimulator/Devices > /dev/null 2>&1 < /dev/null &'";
    await exec.execWithRetriesAndLogs(cmd, undefined, { trying: `Launching device ${udid}...` }, 1);
  }
}

module.exports = AppleSimUtils;
