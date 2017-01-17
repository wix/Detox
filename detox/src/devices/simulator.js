const utils = require('../utils');
const exec = require('child_process').exec;
const spawn = require('child_process').spawn;
const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const websocket = require('../websocket');

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
    this._appLogProcess;

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

  _getBundleIdFromApp(appPath, onComplete) {
    try {
      const absPath = this._getAppAbsolutePath(appPath);
      const infoPlistPath = path.join(absPath, '/Info.plist');
      bplist.parseFile(infoPlistPath, (err, obj) => {
        if (err) {
          onComplete(err);
          return;
        }
        if (Array.isArray(obj)) obj = obj[0];
        const bundleId = obj['CFBundleIdentifier'];
        if (!bundleId) {
          onComplete(new Error(`field CFBundleIdentifier not found inside Info.plist of app binary at ${absPath}`));
          return;
        }
        onComplete(null, bundleId);
      });
    } catch (e) {
      onComplete(e);
      return;
    }
  }

  // fb simctl commands (we try to use it as much as possible since it supports multiple instances)
  _executeSimulatorCommand(options, onComplete) {
    const frameworkPath = __dirname + "/../../Detox.framework/Detox";
    if(fs.existsSync(frameworkPath) === false)
    {
      throw new Error('Detox.framework not found at ' + frameworkPath)
    }

    const fbsimctlPath = 'fbsimctl'; //By this point, it should already be installed on the system by brew.
    const cmd = "export FBSIMCTL_CHILD_DYLD_INSERT_LIBRARIES=\"" + frameworkPath + "\" && " + fbsimctlPath + ' ' + options.args;

    if (this._verbose) {
      console.log(`DETOX exec: ${cmd}\n`);
    }
    exec(cmd, (err, stdout, stderr) => {
      if (this._verbose) {
        if (stdout) console.log(`DETOX exec stdout:\n`, stdout, '\n');
        if (stderr) console.log(`DETOX exec stderr:\n`, stderr, '\n');
      }
      if (options.showStdout) {
        console.log(`DETOX fbsimctl ${options.args}:\n`, stdout, '\n');
      }
      if (err) {
        console.error(stdout);
        console.error(stderr);
        onComplete(err, stdout, stderr);
        return;
      }
      onComplete(null, stdout, stderr);
    });
  }

  // original simctl by Apple (we try to use it only where fbsimctl doesn't work or is very slow)
  _executeOrigSimulatorCommand(options, onComplete) {
    const cmd = 'xcrun simctl ' + options.args;
    if (this._verbose) {
      console.log(`DETOX exec: ${cmd}\n`);
    }
    exec(cmd, (err, stdout, stderr) => {
      if (this._verbose) {
        if (stdout) console.log(`DETOX exec stdout:\n`, stdout, '\n');
        if (stderr) console.log(`DETOX exec stderr:\n`, stderr, '\n');
      }
      if (options.showStdout) {
        console.log(`DETOX simctl ${options.args}:\n`, stdout, '\n');
      }
      if (err) {
        console.error(stdout);
        console.error(stderr);
        onComplete(err, stdout, stderr);
        return;
      }
      onComplete(null, stdout, stderr);
    });
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
  _installApp(device, appPath, onComplete) {
    try {
      const query = this._getQueryFromDevice(device);
      const absPath = this._getAppAbsolutePath(appPath);
      const options = {args: `${query} install ${absPath}`};
      this._executeSimulatorCommand(options, (err) => {
        if (err) {
          onComplete(err);
          return;
        }
        onComplete();
      });
    } catch (e) {
      onComplete(e);
      return;
    }
  }

  // ./node_modules/detox-tools/fbsimctl/fbsimctl uninstall org.reactjs.native.example.example
  _uninstallApp(device, appPath, onComplete) {
    const query = this._getQueryFromDevice(device);
    this._getBundleIdFromApp(appPath, (err, bundleId) => {
      if (err) {
        onComplete(err);
        return;
      }
      /*
      // it turns out that for deleting apps the orig simulator is much faster than fb's
      const options = {args: `uninstall booted ${bundleId}`};
      this._executeOrigSimulatorCommand(options, (err2) => {
        onComplete();
      });
      */
      const options = {args: `${query} uninstall ${bundleId}`};
      this._executeSimulatorCommand(options, (err2) => {
        // this might fail if the app isn't installed, so don't worry about failure
        onComplete();
      });
    });
  }

  _getAppLogfile(bundleId, stdout) {
    const suffix = `fbsimulatorcontrol/diagnostics/out_err/${bundleId}_err.txt`;
    const re = new RegExp('[^\\s]+' + suffix);
    const matches = stdout.match(re);
    if (matches && matches.length > 0) {
      const logfile = matches[0];
      console.log(`DETOX app logfile: ${logfile}\n`);
      return logfile;
    }
    return undefined;
  }

  _listenOnAppLogfile(logfile) {
    if (this._appLogProcess) {
      this._appLogProcess.kill();
      this._appLogProcess = undefined;
    }
    if (!logfile) return;
    this._appLogProcess = spawn('tail', ['-f', logfile]);
    this._appLogProcess.stdout.on('data', (buffer) => {
      const data = buffer.toString('utf8');
      if (this._verbose) {
        console.log('DETOX app: ' + data);
      }
    });
  }

  // ./node_modules/detox-tools/fbsimctl/fbsimctl launch org.reactjs.native.example.example arg1 arg2 arg3
  _launchApp(device, appPath, onComplete) {
    const query = this._getQueryFromDevice(device);
    this._getBundleIdFromApp(appPath, (err, bundleId) => {
      if (err) {
        onComplete(err);
        return;
      }
      const options = {args: `${query} launch --stderr ${bundleId} ${this._defaultLaunchArgs.join(' ')}`};
      this._executeSimulatorCommand(options, (err2, stdout, stderr) => {
        if (this._verbose) {
          // in the future we'll allow expectations on logs and _listenOnAppLogfile will always run (remove if)
          this._listenOnAppLogfile(this._getAppLogfile(bundleId, stdout));
        }
        if (err2) {
          onComplete(err2);
          return;
        }
        onComplete();
      });
    });
  }

  // ./node_modules/detox-tools/fbsimctl/fbsimctl relaunch org.reactjs.native.example.example
  _terminateApp(device, appPath, onComplete) {
    const query = this._getQueryFromDevice(device);
    this._getBundleIdFromApp(appPath, (err, bundleId) => {
      if (err) {
        onComplete(err);
        return;
      }
      const options = {args: `${query} terminate ${bundleId}`};
      this._executeSimulatorCommand(options, (err2, stdout, stderr) => {
        if (this._verbose) {
          // in the future we'll allow expectations on logs and _listenOnAppLogfile will always run (remove if)
          this._listenOnAppLogfile(this._getAppLogfile(bundleId, stdout));
        }
        if (err2) {
          onComplete(err2);
          return;
        }
        onComplete();
      });
    });
  }

  // Calling `relaunch` is not good as it seems `fbsimctl` does not forward env variables in this mode.
  _relaunchApp(device, appPath, onComplete) {
    this._terminateApp(device, appPath, (err) => {
      if (err) {
        onComplete(err);
        return;
      }
      this._launchApp(device, appPath, (err3) => {
        if (err3) {
          onComplete(err3);
          return;
        }
        onComplete();
      });
    });
  }

  relaunchApp(onComplete) {
    if (!this._currentScheme.device) {
      onComplete(new Error(`scheme.device property is missing, should hold the device type we test on`));
      return;
    }
    if (!this._currentScheme.app) {
      onComplete(new Error(`scheme.app property is missing, should hold the app binary path`));
      return;
    }
    this._relaunchApp(this._currentScheme.device, this._currentScheme.app, (err) => {
      if (err) {
        onComplete(err);
        return;
      }
      this._waitUntilReady(() => {
        onComplete();
      });
    });
  }

  _deleteAndRelaunchApp(device, appPath, onComplete) {
    this._uninstallApp(device, appPath, (err) => {
      if (err) {
        onComplete(err);
        return;
      }
      this._installApp(device, appPath, (err2) => {
        if (err2) {
          onComplete(err2);
          return;
        }
        this._launchApp(device, appPath, (err3) => {
          if (err3) {
            onComplete(err3);
            return;
          }
          onComplete();
        });
      });
    });
  }

  deleteAndRelaunchApp(onComplete) {
    if (!this._currentScheme.device) {
      onComplete(new Error(`scheme.device property is missing, should hold the device type we test on`));
      return;
    }
    if (!this._currentScheme.app) {
      onComplete(new Error(`scheme.app property is missing, should hold the app binary path`));
      return;
    }
    this._deleteAndRelaunchApp(this._currentScheme.device, this._currentScheme.app, (err) => {
      if (err) {
        onComplete(err);
        return;
      }
      this._waitUntilReady(() => {
        onComplete();
      });
    });
  }

  _getQueryFromDevice(device) {
    let res = '--first 1 --simulators ';
    const deviceParts = device.split(',');
    for (let i = 0 ; i < deviceParts.length ; i++) res += `"${deviceParts[i].trim()}" `;
    return res.trim();
  }

  // ./node_modules/detox-tools/fbsimctl/fbsimctl "iPhone 5" "iOS 8.3" list
  _listSimulators(device, onComplete) {
    const query = this._getQueryFromDevice(device);
    const options = {args: `${query} list`, showStdout: true};
    this._executeSimulatorCommand(options, (err) => {
      if (err) {
        onComplete(err);
        return;
      }
      onComplete();
    });
  }

  // ./node_modules/detox-tools/fbsimctl/fbsimctl "iPhone 5" "iOS 8.3" boot
  _bootSimulator(device, onComplete) {
    const query = this._getQueryFromDevice(device);
    const options = {args: `--state=shutdown --state=shutting-down ${query} boot`};
    this._executeSimulatorCommand(options, (err) => {
      if (err) {
        onComplete(err);
        return;
      }
      onComplete();
    });
  }

  // ./node_modules/detox-tools/fbsimctl/fbsimctl "iPhone 5" "iOS 8.3" shutdown
  _shutdownSimulator(device, onComplete) {
    const query = this._getQueryFromDevice(device);
    const options = {args: `--state=booted ${query} shutdown`};
    this._executeSimulatorCommand(options, (err) => {
      if (err) {
        onComplete(err);
        return;
      }
      onComplete();
    });
  }

  // returns true if found scheme, false if no scheme found
  _setCurrentScheme(params) {
    let scheme;
    const schemeOverride = utils.getArgValue('scheme');
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
      console.log('DETOX scheme:\n', scheme, '\n');
      return true;
    } else {
      return false;
    }
  }

  prepare(params, onComplete) {
    this._verbose = utils.getArgValue('verbose');
    if (params['session']) {
      const settings = params['session'];
      if (!settings.server) {
        onComplete(new Error(`session.server property is missing, should hold the server address`));
        return;
      }
      if (!settings.sessionId) {
        onComplete(new Error(`session.sessionId property is missing, should hold the server session id`));
        return;
      }
      this._defaultLaunchArgs = ['-detoxServer', settings.server, '-detoxSessionId', settings.sessionId];
    } else {
      onComplete(new Error(`No session configuration was found, pass settings under the session property`));
      return;
    }
    if (this._setCurrentScheme(params)) {
      if (!this._currentScheme.device) {
        onComplete(new Error(`scheme.device property is missing, should hold the device type we test on`));
        return;
      }
      this._listSimulators(this._currentScheme.device, (err) => {
        this._bootSimulator(this._currentScheme.device, (err2) => {
          if (err2) {
            onComplete(err2);
            return;
          }
          this.deleteAndRelaunchApp(onComplete);
        });
      });
    } else {
      onComplete(new Error(`No scheme was found, in order to test a simulator pass settings under the ios-simulator property`));
      return;
    }
  }

  openURL(url, onComplete) {
    if (!this._currentScheme.device) {
      onComplete(new Error(`scheme.device property is missing, should hold the device type we test on`));
      return;
    }

    const query = this._getQueryFromDevice(this._currentScheme.device);
    const options = {args: `${query} open ${url}`};
    this._executeSimulatorCommand(options, (err, stdout, stderr) => {
      if (err) {
        onComplete(err);
        return;
      }
      onComplete();
    });
  }
}

module.exports = Simulator;