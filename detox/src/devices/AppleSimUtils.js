const _ = require('lodash');
const exec = require('../utils/exec');

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
    await this._execAppleSimUtilsCommand({
      args: `--simulator ${udid} --bundle ${bundleId} --setPermissions ${_.join(permissions, ',')}`
    }, statusLogs, 1);
  }

  async findDeviceUUID(query) {
    const statusLogs = {
      trying: `Searching for device matching ${query}...`
    };
    let correctQuery = correctQueryWithOS(query);
    const response = await this._execAppleSimUtilsCommand({ args: `--list "${correctQuery}" --maxResults=1` }, statusLogs, 1);
    const parsed = parseStdout(response);
    const udid = _.get(parsed, [0, 'udid']);
    if (!udid) {
      throw new Error(`Can't find a simulator to match with "${query}", run 'xcrun simctl list' to list your supported devices.
      It is advised to only state a device type, and not to state iOS version, e.g. "iPhone 7"`);
    }
    return udid;
  }

  async _execAppleSimUtilsCommand(options, statusLogs, retries, interval) {
    const bin = `applesimutils`;
    return await exec.execWithRetriesAndLogs(bin, options, statusLogs, retries, interval);
  }
}

function correctQueryWithOS(query) {
  let correctQuery = query;
  if (_.includes(query, ',')) {
    const parts = _.split(query, ',');
    correctQuery = `${parts[0].trim()}, OS=${parts[1].trim()}`;
  }
  return correctQuery;
}

function parseStdout(response) {
  const stdout = _.get(response, 'stdout');
  if (_.isEmpty(stdout)) {
    return [];
  }
  return JSON.parse(stdout);
}

module.exports = AppleSimUtils;
