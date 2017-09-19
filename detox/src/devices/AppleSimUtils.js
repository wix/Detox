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
    const options = { args: `--simulator ${udid} --bundle ${bundleId} --setPermissions ${_.join(permissions, ',')}` };
    await this._execAppleSimUtilsCommand(options, statusLogs, 1);
  }

  async list(query) {
    const statusLogs = {
      trying: `Listing devices...`
    };
    let correctQuery = query;
    if (_.includes(query, ',')) {
      const parts = _.split(query, ',');
      correctQuery = `${parts[0].trim()}, OS=${parts[1].trim()}`;
    }
    await this._execAppleSimUtilsCommand({ args: `--list "${correctQuery}" --maxResults=1` }, statusLogs, 1);
  }

  async _execAppleSimUtilsCommand(options, statusLogs, retries, interval) {
    const bin = `applesimutils`;
    return await exec.execWithRetriesAndLogs(bin, options, statusLogs, retries, interval);
  }
}

module.exports = AppleSimUtils;
