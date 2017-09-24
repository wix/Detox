const _ = require('lodash');
const log = require('npmlog');
const exec = require('../utils/exec');
const retry = require('../utils/retry');

// FBSimulatorControl command line docs
// https://github.com/facebook/FBSimulatorControl/issues/250
// https://github.com/facebook/FBSimulatorControl/blob/master/fbsimctl/FBSimulatorControlKitTests/Tests/Unit/CommandParsersTests.swift



class Fbsimctl {



  async terminate(udid, bundleId) {
    const launchBin = `/usr/bin/xcrun simctl terminate ${udid} ${bundleId}`;
    await exec.execWithRetriesAndLogs(launchBin, undefined, {
      trying: `Terminating ${bundleId}...`,
      successful: `${bundleId} terminated`
    }, 1);
  }

  async shutdown(udid) {
    const options = { args: `${udid} shutdown` };
    await this._execFbsimctlCommand(options);
  }

  async open(udid, url) {
    const options = { args: `${udid} open ${url}` };
    await this._execFbsimctlCommand(options);
  }

  async setLocation(udid, lat, lon) {
    const options = { args: `${udid} set_location ${lat} ${lon}` };
    await this._execFbsimctlCommand(options);
  }

  async resetContentAndSettings(udid) {
    await this.shutdown(udid);
    const result = await exec.execWithRetriesAndLogs(`/usr/bin/xcrun simctl erase ${udid}`);
    const resultCode = parseInt(result.stdout.trim().split(':')[1]);
    await this.boot(udid);
    return resultCode;
  }

  async _execFbsimctlCommand(options, statusLogs, retries, interval) {
    const bin = `fbsimctl --json`;
    return await exec.execWithRetriesAndLogs(bin, options, statusLogs, retries, interval);
  }
}

module.exports = Fbsimctl;
