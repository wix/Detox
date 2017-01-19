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
const bplist = require('bplist-parser');

// FBSimulatorControl command line docs
// https://github.com/facebook/FBSimulatorControl/issues/250
// https://github.com/facebook/FBSimulatorControl/blob/master/fbsimctl/FBSimulatorControlKitTests/Tests/Unit/CommandParsersTests.swift

class Simulator extends Device {

  constructor() {
    super();
    this._defaultLaunchArgs = [];
    this._currentScheme = {};
    this._verbose = false;
    this._appLogProcess = null;
    this._currentSimulator = "";

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

  reloadReactNativeApp(onLoad) {
    websocket.waitForNextAction('ready', onLoad);
    websocket.sendAction('reactNativeReload');
  }

  _getBundleIdFromApp(appPath) {
    const absPath = this._getAppAbsolutePath(appPath);
    const infoPlistPath = path.join(absPath, '/Info.plist');
    return new Promise((resolve, reject) => {
      bplist.parseFile(infoPlistPath, (err, obj) => {
        if (err) {
          reject(err);
          return;
        }
        if (Array.isArray(obj)) {
          obj = obj[0];
        }
        const bundleId = obj.CFBundleIdentifier;
        if (!bundleId) {
          reject(new Error(`field CFBundleIdentifier not found inside Info.plist of app binary at ${absPath}`));
          return;
        }
        resolve(bundleId);
      });
    });
  }

  // fb simctl commands (we try to use it as much as possible since it supports multiple instances)
  async _executeSimulatorCommand(options) {
    const frameworkPath = path.join(__dirname, `/../../Detox.framework/Detox`);
    if (fs.existsSync(frameworkPath) === false) {
      throw new Error(`Detox.framework not found at ${frameworkPath}`);
    }

    const fbsimctlPath = 'fbsimctl'; //By this point, it should already be installed on the system by brew.
    const cmd = "export FBSIMCTL_CHILD_DYLD_INSERT_LIBRARIES=\"" + frameworkPath + "\" && " + fbsimctlPath + ' ' + options.args;
    log.verbose(`exec: ${cmd}\n`);

    try {
      const result = await exec(cmd);
      if (result.stdout) {
        log.verbose(`exec stdout:\n`, result.stdout);
      }
      if (result.stderr) {
        log.verbose(`exec stderr:\n`, result.stderr);
      }
      if (options.showStdout) {
        log.verbose(`fbsimctl ${options.args}:\n`, result.stdout);
      }

      if (result.childProcess.exitCode !== 0) {
        log.error(`exec stdout:\n`, result.stdout);
        log.error(`exec stderr:\n`, result.stderr);
      }
      return result;
    } catch (ex) {
      throw ex;
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

  // ./node_modules/detox-tools/fbsimctl/fbsimctl install ./ios/build/Build/Products/Debug-iphonesimulator/example.app
  async _installApp(appPath) {
    const absPath = this._getAppAbsolutePath(appPath);
    const options = {args: `${this._currentSimulator} install ${absPath}`};
    return await this._executeSimulatorCommand(options);
  }

  // ./node_modules/detox-tools/fbsimctl/fbsimctl uninstall org.reactjs.native.example.example
  async _uninstallApp(appPath) {
    const bundleId = await this._getBundleIdFromApp(appPath);
    const options = {args: `${this._currentSimulator} uninstall ${bundleId}`};
    try {
      await this._executeSimulatorCommand(options);
    } catch (ex) {
      //that's ok
    }
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

  // ./node_modules/detox-tools/fbsimctl/fbsimctl launch org.reactjs.native.example.example arg1 arg2 arg3
  async _launchApp(appPath) {
    const bundleId = await this._getBundleIdFromApp(appPath);
    const options = {args: `${this._currentSimulator} launch --stderr ${bundleId} ${this._defaultLaunchArgs.join(' ')}`};
    const result = await this._executeSimulatorCommand(options);
    if (this._verbose) {
      // in the future we'll allow expectations on logs and _listenOnAppLogfile will always run (remove if)
      //this._listenOnAppLogfile(this._getAppLogfile(bundleId, result.stdout));
    }
  }

  // ./node_modules/detox-tools/fbsimctl/fbsimctl relaunch org.reactjs.native.example.example
  async _terminateApp(appPath) {
    const bundleId = await this._getBundleIdFromApp(appPath);
    const options = {args: `${this._currentSimulator}  terminate ${bundleId}`};
    const result = await this._executeSimulatorCommand(options);
    if (this._verbose) {
      // in the future we'll allow expectations on logs and _listenOnAppLogfile will always run (remove if)
      //this._listenOnAppLogfile(this._getAppLogfile(bundleId, result.stdout));
    }
  }

  // Calling `relaunch` is not good as it seems `fbsimctl` does not forward env variables in this mode.
  async _relaunchApp(appPath) {
    await this._terminateApp(appPath);
    await this._launchApp(appPath);
  }

  async relaunchApp(onComplete) {
    if (!this._currentScheme.device) {
      onComplete(new Error(`scheme.device property is missing, should hold the device type we test on`));
      return;
    }
    if (!this._currentScheme.app) {
      onComplete(new Error(`scheme.app property is missing, should hold the app binary path`));
      return;
    }
    await this._relaunchApp(this._currentScheme.app);
    await this._waitUntilReady(() => {
      onComplete();
    });
  }

  async _deleteAndRelaunchApp(appPath) {
    await this._uninstallApp(appPath);
    await this._installApp(appPath);
    await this._launchApp(appPath);
  }

  async deleteAndRelaunchApp(onComplete) {
    if (!this._currentScheme.device) {
      throw new Error(`scheme.device property is missing, should hold the device type we test on`);
    }
    if (!this._currentScheme.app) {
      throw new Error(`scheme.app property is missing, should hold the app binary path`);
    }
    await this._deleteAndRelaunchApp(this._currentScheme.app);
    this._waitUntilReady(() => {
      onComplete();
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

  // ./node_modules/detox-tools/fbsimctl/fbsimctl "iPhone 5" "iOS 8.3" list
  async _listSimulators(device) {
    const query = this._getQueryFromDevice(device);
    const options = {args: `${query} --first 1 --simulators list | head -1 | awk '/(^[0-9A-F]{8}-[0-9A-F]{4}-[1-5][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}).*/{ print $1 }'`, showStdout: true};
    const result = await this._executeSimulatorCommand(options);
    const simId = result.stdout.trim();
    if (!simId) {
      throw new Error(`can't find a simulator to match with ${device}`);
    }
    //stdout will contain the requested simulator id.
    this._currentSimulator = simId;
  }

  // ./node_modules/detox-tools/fbsimctl/fbsimctl "iPhone 5" "iOS 8.3" boot
  async _bootSimulator() {
    const options = {args: `--state=shutdown --state=shutting-down ${this._currentSimulator} boot`};
    const result = await this._executeSimulatorCommand(options);
    return result.childProcess.exitCode === 0;
  }

  // ./node_modules/detox-tools/fbsimctl/fbsimctl "iPhone 5" "iOS 8.3" shutdown
  async _shutdownSimulator(device) {
    const query = this._getQueryFromDevice(device);
    const options = {args: `--state=booted ${query} shutdown`};
    await this._executeSimulatorCommand(options);
  }

  // returns true if found scheme, false if no scheme found
  _setCurrentScheme(params) {
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
      this._currentScheme = scheme;
      log.info(`scheme`, scheme);
      return true;
    } else {
      return false;
    }
  }

  async prepare(params, onComplete) {
    if (params.session) {
      const settings = params.session;
      if (!settings.server) {
        throw new Error(`session.server property is missing, should hold the server address`);
      }
      if (!settings.sessionId) {
        throw new Error(`session.sessionId property is missing, should hold the server session id`);
      }
      this._defaultLaunchArgs = ['-detoxServer', settings.server, '-detoxSessionId', settings.sessionId];
    } else {
      throw new Error(`No session configuration was found, pass settings under the session property`);
    }
    if (this._setCurrentScheme(params)) {
      if (!this._currentScheme.device) {
        throw new Error(`scheme.device property is missing, should hold the device type we test on`);
      }
      await this._listSimulators(this._currentScheme.device);

      await retry({retries: 10, interval: 2000}, async () => {
        log.info('trying to start simulator...');
        if (await this._bootSimulator()) {
          log.info('Simulator started');
        }
      });

      await this.deleteAndRelaunchApp(onComplete);
    } else {
      throw new Error(`No scheme was found, in order to test a simulator pass settings under the ios-simulator property`);
    }
  }

  async openURL(url) {
    if (!this._currentScheme.device) {
      throw new Error(`scheme.device property is missing, should hold the device type we test on`);
    }

    const query = this._getQueryFromDevice(this._currentScheme.device);
    const options = {args: `${query} open ${url}`};
    await this._executeSimulatorCommand(options);
  }
}

module.exports = Simulator;
