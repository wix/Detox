const _ = require('lodash');
const exec = require('../utils/exec');

class AppleSimUtils {

  async setPermissions(udid, bundleId, permissionsObj) {
    const statusLogs = {
      trying: `Trying to set permissions...`,
      successful: 'Permissions are set'
    };
    let permissions = [];
    _.forEach(permissionsObj, function(shouldAllow, permission) {
      permissions.push(permission + '=' + shouldAllow);
    });
    const options = {args: `--simulator ${udid} --bundle ${bundleId} --setPermissions ${_.join(permissions, ',')}`};
    await this._execAppleSimUtilsCommand(options, statusLogs, 1);

  }

  async _execAppleSimUtilsCommand(options, statusLogs, retries, interval) {
    const bin = `applesimutils`;
    return await exec.execWithRetriesAndLogs(bin, options, statusLogs, retries, interval);
  }
}

module.exports = AppleSimUtils;
