const _ = require('lodash');
const log = require('npmlog');
const exec = require('../utils/exec');
const retry = require('../utils/retry');
const environment = require('../utils/environment');

// FBSimulatorControl command line docs
// https://github.com/facebook/FBSimulatorControl/issues/250
// https://github.com/facebook/FBSimulatorControl/blob/master/fbsimctl/FBSimulatorControlKitTests/Tests/Unit/CommandParsersTests.swift

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

class Fbsimctl {

  async install(udid, absPath) {
    const statusLogs = {
      trying: `Installing ${absPath}...`,
      successful: `${absPath} installed`
    };
    const options = { args: `${udid} install ${absPath}` };
    return await this._execFbsimctlCommand(options, statusLogs);
  }

  async uninstall(udid, bundleId) {
    const statusLogs = {
      trying: `Uninstalling ${bundleId}...`,
      successful: `${bundleId} uninstalled`
    };
    const options = { args: `${udid} uninstall ${bundleId}` };
    try {
      await this._execFbsimctlCommand(options, statusLogs, 1);
    } catch (ex) {
      //that's ok
    }
  }

  async launch(udid, bundleId, launchArgs) {
    const args = [];
    _.forEach(launchArgs, (value, key) => {
      args.push(`${key} ${value}`);
    });

    const logsInfo = new LogsInfo(udid);
    const launchBin = `/bin/cat /dev/null >${logsInfo.absStdout} 2>${logsInfo.absStderr} && ` +
                      `SIMCTL_CHILD_DYLD_INSERT_LIBRARIES="${await environment.getFrameworkPath()}/Detox" ` +
                      `/usr/bin/xcrun simctl launch --stdout=${logsInfo.simStdout} --stderr=${logsInfo.simStderr} ` +
                      `${udid} ${bundleId} --args ${args.join(' ')}`;
    const result = await exec.execWithRetriesAndLogs(launchBin, undefined, {
      trying: `Launching ${bundleId}...`,
      successful: `${bundleId} launched. The stdout and stderr logs were recreated, you can watch them with:\n` +
      `        tail -F ${logsInfo.absJoined}`
    }, 1);
    return parseInt(result.stdout.trim().split(':')[1]);
  }

  async sendToHome(udid) {
    const result = await exec.execWithRetriesAndLogs(`/usr/bin/xcrun simctl launch ${udid} com.apple.springboard`);
    return parseInt(result.stdout.trim().split(':')[1]);
  }

  getLogsPaths(udid) {
    const logsInfo = new LogsInfo(udid);
    return {
      stdout: logsInfo.absStdout,
      stderr: logsInfo.absStderr
    }
  }

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
