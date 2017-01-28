const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const log = require('npmlog');
const retry = require('../utils/retry');
const exec = require('child-process-promise').exec;

// FBSimulatorControl command line docs
// https://github.com/facebook/FBSimulatorControl/issues/250
// https://github.com/facebook/FBSimulatorControl/blob/master/fbsimctl/FBSimulatorControlKitTests/Tests/Unit/CommandParsersTests.swift

class Fbsimctl {

  constructor() {
    this._operationCounter = 0;
  }

  async list(device) {
    const statusLogs = {
      trying: `Listing devices...`
    };
    const query = this._getQueryFromDevice(device);
    const options = {args: `${query} --first 1 --simulators list`};
    let result = {};
    try {
      result = await this._execFbsimctlCommand(options, statusLogs, 1);
      let simId;
      if (result.stdout) {
        const parsedJson = JSON.parse(result.stdout);
        simId = _.get(parsedJson, 'subject.udid');
        return simId;
      }
    } catch (ex) {
      throw new Error('Can\'t find a simulator to match with \'' + device + '\', run \'fbsimctl list\' to list your supported devices.\n'
                      + 'It is advised to only state a device type, and not to state iOS version, e.g. \'iPhone 7\'');
    }
  }

  async boot(udid) {
    const statusLogs = {
      trying: `trying to boot device...`,
      successful: `device ${udid} booted`
    };

    const options = {args: `--state=shutdown --state=shutting-down ${udid} boot`};
    const result = await this._execFbsimctlCommand(options, statusLogs);
    //return result.childProcess.exitCode === 0;
  }

  async install(udid, absPath) {
    const statusLogs = {
      trying: `Installing ${absPath}...`,
      successful: `${absPath} installed`
    };
    const options = {args: `${udid} install ${absPath}`};
    return await this._execFbsimctlCommand(options, statusLogs);
  }

  async uninstall(udid, bundleId) {
    const statusLogs = {
      trying: `Uninstalling ${bundleId}...`,
      successful: `${bundleId} uninstalled`
    };
    const options = {args: `${udid} uninstall ${bundleId}`};
    try {
      await this._execFbsimctlCommand(options, statusLogs, 1);
    } catch (ex) {
      //that's ok
    }
  }

  async launch(udid, bundleId, launchArgs) {
    const statusLogs = {
      trying: `Launching ${bundleId}...`,
      successful: `${bundleId} launched`
    };
    const options = {
      prefix: `export FBSIMCTL_CHILD_DYLD_INSERT_LIBRARIES="${this._getFrameworkPath()}"`,
      args: `${udid} launch --stderr ${bundleId} ${launchArgs.join(' ')}`
    };
    const result = await this._execFbsimctlCommand(options, statusLogs);
    // in the future we'll allow expectations on logs and _listenOnAppLogfile will always run (remove if)
    //this._listenOnAppLogfile(this._getAppLogfile(bundleId, result.stdout));
  }

  async terminate(udid, bundleId) {
    const statusLogs = {
      trying: `Terminating ${bundleId}...`,
      successful: `${bundleId} terminated`
    };
    const options = {args: `${udid}  terminate ${bundleId}`};
    const result = await this._execFbsimctlCommand(options, statusLogs);
    // in the future we'll allow expectations on logs and _listenOnAppLogfile will always run (remove if)
    //this._listenOnAppLogfile(this._getAppLogfile(bundleId, result.stdout));
  }

  async shutdown(udid) {
    const options = {args: `${udid} shutdown`};
    await this._execFbsimctlCommand(options);
  }

  async open(udid, url) {
    const options = {args: `${udid} open ${url}`};
    await this._execFbsimctlCommand(options);
  }

  async isDeviceBooted(udid) {
    const options = {args: `${udid} list`};
    const result = await this._execFbsimctlCommand(options);
    return JSON.parse(result.stdout).subject.state !== 'Booted';
  }

  async _execFbsimctlCommand(options, statusLogs, retries = 10) {
    this._operationCounter++;
    if (!options.args) {
      throw new Error(`args must be specified`);
    }
    const cmd = `${options.prefix ? options.prefix + '&&' : ''} fbsimctl --json ${options.args}`;
    log.verbose(`${this._operationCounter}: ${cmd}`);

    let result;
    await retry({retries, interval: 1000}, async() => {
      if (statusLogs && statusLogs.trying) {
        log.info(`${this._operationCounter}: ${statusLogs.trying}`);
      }
      result = await exec(cmd);
    });
    if (result === undefined) {
      throw new Error(`${this._operationCounter}: ${cmd} could not run`);
    }

    if (result.stdout) {
      log.verbose(`${this._operationCounter}: stdout:`, result.stdout);
    }

    if (result.stderr) {
      log.verbose(`${this._operationCounter}: stderr:`, result.stderr);
    }

    if (statusLogs && statusLogs.successful) {
      log.info(`${this._operationCounter}: ${statusLogs.successful}`);
    }

    if (result.childProcess.exitCode !== 0) {
      log.error(`${this._operationCounter}: stdout:`, result.stdout);
      log.error(`${this._operationCounter}: stderr:`, result.stderr);
    }

    return result;
  }

  _getFrameworkPath() {
    const frameworkPath = path.join(__dirname, `/../../Detox.framework/Detox`);
    if (!fs.existsSync(frameworkPath)) {
      throw new Error(`Detox.framework not found at ${frameworkPath}`);
    }
    return frameworkPath;
  }

  _getQueryFromDevice(device) {
    let res = '';
    const deviceParts = device.split(',');
    for (let i = 0; i < deviceParts.length; i++) {
      res += `"${deviceParts[i].trim()}" `;
    }
    return res.trim();
  }
}

module.exports = Fbsimctl;
