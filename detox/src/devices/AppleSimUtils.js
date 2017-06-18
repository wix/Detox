const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const log = require('npmlog');
const exec = require('../utils/exec');

// AppleSimulatorUtils command line docs
// https://github.com/wix/AppleSimulatorUtils


class AppleSimUtils {

  constructor() {
    this._operationCounter = 0;
  }

  async setLocationPermission(udid, bundleId, permission) {
    const statusLogs = {
      trying: `Setting permission to ${permission}`,
      successful: `Permission "${permission}" granted`
    };

    const options = {args: ` --bundle ${bundleId} --simulator ${udid} --setPermissions "location=${permission}"`};
    await this._execAppleSimUtilsCommand(options, statusLogs);
  }

  async _execAppleSimUtilsCommand(options, statusLogs, retries, interval) {
    const bin = `applesimutils`;
    return await exec.execWithRetriesAndLogs(bin, options, statusLogs, retries, interval);
  }
  
}

module.exports = AppleSimUtils;
