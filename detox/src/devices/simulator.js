const log = require('npmlog');
const exec = require('child-process-promise').exec;
const spawn = require('child_process').spawn;
const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const websocket = require('../websocket');
const retry = require('../utils/retry');
const argparse = require('../utils/argparse');
const Device = require('./device');
const FBsimctl = require('./Fbsimctl');

class Simulator extends Device {

  constructor() {
    super();
    this._fbsimctl = new FBsimctl();
    this._defaultLaunchArgs = [];
    this._currentScheme = {};
    this._verbose = false;
    this._appLogProcess = null;
    this._simulatorUdid = "";
    this._bundleId = "";

    process.on('exit', () => {
      if (this._appLogProcess) {
        this._appLogProcess.kill();
        this._appLogProcess = undefined;
      }
    });
  }

  _waitUntilReady(onReady) {
    websocket.waitForNextAction('ready', onReady);
    websocket.sendAction('isReady');
  }

  async _getBundleIdFromApp(appPath) {
    const absPath = this._getAppAbsolutePath(appPath);
    try {
      const result = await exec(`/usr/libexec/PlistBuddy -c "Print CFBundleIdentifier" ${path.join(absPath, 'Info.plist')}`);
      return _.trim(result.stdout);
    } catch (ex) {
      throw new Error(`field CFBundleIdentifier not found inside Info.plist of app binary at ${absPath}`);
    }
  }

  _getAppAbsolutePath(appPath) {
    const absPath = path.join(process.cwd(), appPath);
    try {
      fs.accessSync(absPath, fs.F_OK);
    } catch (e) {
      throw new Error(`app binary not found at ${absPath}, did you build it?`);
    }
    return absPath;
  }

  _getAppLogfile(bundleId, stdout) {
    const suffix = `fbsimulatorcontrol/diagnostics/out_err/${bundleId}_err.txt`;
    const re = new RegExp('[^\\s]+' + suffix);
    const matches = stdout.match(re);
    if (matches && matches.length > 0) {
      const logfile = matches[0];
      log.info(`app logfile: ${logfile}\n`);
      return logfile;
    }
    return undefined;
  }

  _listenOnAppLogfile(logfile) {
    if (this._appLogProcess) {
      this._appLogProcess.kill();
      this._appLogProcess = undefined;
    }
    if (!logfile) {
      return;
    }
    this._appLogProcess = spawn('tail', ['-f', logfile]);
    this._appLogProcess.stdout.on('data', (buffer) => {
      const data = buffer.toString('utf8');
      log.verbose('app: ' + data);
    });
  }

  _getQueryFromDevice(device) {
    let res = '';
    const deviceParts = device.split(',');
    for (let i = 0; i < deviceParts.length; i++) {
      res += `"${deviceParts[i].trim()}" `;
    }
    return res.trim();
  }

  _detrmineCurrentScheme(params) {
    let scheme;
    const schemeOverride = argparse.getArgValue('scheme');
    if (schemeOverride) {
      scheme = _.get(params, schemeOverride);
    }
    if (!scheme) {
      scheme = _.get(params, 'ios-simulator.debug');
    }
    if (!scheme) {
      scheme = _.get(params, 'ios-simulator.release');
    }
    if (!scheme) {
      scheme = _.get(params, 'ios-simulator');
    }
    if (scheme) {
      if (!scheme.device) {
        throw new Error(`scheme.device property is missing, should hold the device type to test on`);
      }
      if (!scheme.app) {
        throw new Error(`scheme.app property is missing, should hold the app binary path`);
      }

      log.info(`scheme`, scheme);
      return scheme;
    } else {
      throw new Error(`No scheme was found, in order to test a simulator pass settings under the ios-simulator property`);
    }
  }

  _validateParams(params) {
    if (!params.session) {
      throw new Error(`No session configuration was found, pass settings under the session property`);
    }

    const settings = params.session;

    if (!settings.server) {
      throw new Error(`session.server property is missing, should hold the server address`);
    }

    if (!settings.sessionId) {
      throw new Error(`session.sessionId property is missing, should hold the server session id`);
    }
  }

  async prepare(params, onComplete) {
    this._validateParams(params);

    const settings = params.session;
    this._defaultLaunchArgs = ['-detoxServer', settings.server, '-detoxSessionId', settings.sessionId];

    this._currentScheme = this._detrmineCurrentScheme(params);
    this._simulatorUdid = await this._fbsimctl.list(this._currentScheme.device);
    this._bundleId = await this._getBundleIdFromApp(this._currentScheme.app);
    await this._fbsimctl.boot(this._simulatorUdid);
    await this.deleteAndRelaunchApp(onComplete);
  }

  async relaunchApp(onComplete) {
    // Calling `relaunch` is not good as it seems `fbsimctl` does not forward env variables in this mode.
    await this._fbsimctl.terminate(this._simulatorUdid, this._bundleId);
    await this._fbsimctl.launch(this._simulatorUdid, this._bundleId, this._defaultLaunchArgs);
    await this._waitUntilReady(() => {
      onComplete();
    });
  }

  async deleteAndRelaunchApp(onComplete) {
    await this._fbsimctl.uninstall(this._simulatorUdid, this._bundleId);
    await this._fbsimctl.install(this._simulatorUdid, this._getAppAbsolutePath(this._currentScheme.app));
    await this._fbsimctl.launch(this._simulatorUdid, this._bundleId, this._defaultLaunchArgs);
    this._waitUntilReady(() => {
      onComplete();
    });
  }

  reloadReactNativeApp(onLoad) {
    websocket.waitForNextAction('ready', onLoad);
    websocket.sendAction('reactNativeReload');
  }

  async openURL(url) {
    await this._fbsimctl.open(this._simulatorUdid, url);
  }
}

module.exports = Simulator;
