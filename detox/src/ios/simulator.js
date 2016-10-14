const utils = require('../utils.js');
const exec = require('child_process').exec;
const spawn = require('child_process').spawn;
const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const bplist = require('bplist-parser');
const websocket = require('../websocket');

// FBSimulatorControl command line docs
// https://github.com/facebook/FBSimulatorControl/issues/250
// https://github.com/facebook/FBSimulatorControl/blob/master/fbsimctl/FBSimulatorControlKitTests/Tests/Unit/CommandParsersTests.swift

let _defaultLaunchArgs = [];
let _currentScheme = {};
let _verbose = false;
let _appLogProcess;

function _waitUntilReady(onReady) {
  websocket.waitForNextAction('ready', onReady);
  websocket.sendAction('isReady');
}

function reloadReactNativeApp(onLoad) {
  websocket.waitForNextAction('ready', onLoad);
  websocket.sendAction('reactNativeReload');
}

function _getBundleIdFromApp(appPath, onComplete) {
  try {
    const absPath = _getAppAbsolutePath(appPath);
    const infoPlistPath = path.join(absPath, '/Info.plist');
    bplist.parseFile(infoPlistPath, function (err, obj) {
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
function _executeSimulatorCommand(options, onComplete) {
  const fbsimctlPath = 'fbsimctl'; //By this point, it should already be installed on the system by brew.
  const cmd = fbsimctlPath + ' ' + options.args;
  if (_verbose) {
    console.log(`DETOX exec: ${cmd}\n`);
  }
  exec(cmd, function (err, stdout, stderr) {
    if (_verbose) {
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
function _executeOrigSimulatorCommand(options, onComplete) {
  const cmd = 'xcrun simctl ' + options.args;
  if (_verbose) {
    console.log(`DETOX exec: ${cmd}\n`);
  }
  exec(cmd, function (err, stdout, stderr) {
    if (_verbose) {
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

function _getAppAbsolutePath(appPath) {
  const absPath = path.join(__dirname, '../../../../', appPath);
  try {
    fs.accessSync(absPath, fs.F_OK);
  } catch (e) {
    throw new Error(`app binary not found at ${absPath}, did you build it?`);
  }
  return absPath;
}

// ./node_modules/detox-tools/fbsimctl/fbsimctl install ./ios/build/Build/Products/Debug-iphonesimulator/example.app
function _installApp(device, appPath, onComplete) {
  try {
    const query = _getQueryFromDevice(device);
    const absPath = _getAppAbsolutePath(appPath);
    const options = {args: `${query} install ${absPath}`};
    _executeSimulatorCommand(options, function (err) {
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
function _uninstallApp(device, appPath, onComplete) {
  const query = _getQueryFromDevice(device);
  _getBundleIdFromApp(appPath, function (err, bundleId) {
    if (err) {
      onComplete(err);
      return;
    }
    /*
    // it turns out that for deleting apps the orig simulator is much faster than fb's
    const options = {args: `uninstall booted ${bundleId}`};
    _executeOrigSimulatorCommand(options, function (err2) {
      onComplete();
    });
    */
    const options = {args: `${query} uninstall ${bundleId}`};
    _executeSimulatorCommand(options, function (err2) {
      // this might fail if the app isn't installed, so don't worry about failure
      onComplete();
    });
  });
}

function _getAppLogfile(bundleId, stdout) {
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

function _listenOnAppLogfile(logfile) {
  if (_appLogProcess) {
    _appLogProcess.kill();
    _appLogProcess = undefined;
  }
  if (!logfile) return;
  _appLogProcess = spawn('tail', ['-f', logfile]);
  _appLogProcess.stdout.on('data', function (buffer) {
    const data = buffer.toString('utf8');
    if (_verbose) {
      console.log('DETOX app: ' + data);
    }
  });
}

process.on('exit', function () {
  if (_appLogProcess) {
    _appLogProcess.kill();
    _appLogProcess = undefined;
  }
});

// ./node_modules/detox-tools/fbsimctl/fbsimctl launch org.reactjs.native.example.example arg1 arg2 arg3
function _launchApp(device, appPath, onComplete) {
  const query = _getQueryFromDevice(device);
  _getBundleIdFromApp(appPath, function (err, bundleId) {
    if (err) {
      onComplete(err);
      return;
    }
    const options = {args: `${query} launch --stderr ${bundleId} ${_defaultLaunchArgs.join(' ')}`};
    _executeSimulatorCommand(options, function (err2, stdout, stderr) {
      if (_verbose) {
        // in the future we'll allow expectations on logs and _listenOnAppLogfile will always run (remove if)
        _listenOnAppLogfile(_getAppLogfile(bundleId, stdout));
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
function _relaunchApp(device, appPath, onComplete) {
  const query = _getQueryFromDevice(device);
  _getBundleIdFromApp(appPath, function (err, bundleId) {
    if (err) {
      onComplete(err);
      return;
    }
    const options = {args: `${query} relaunch ${bundleId} ${_defaultLaunchArgs.join(' ')}`};
    _executeSimulatorCommand(options, function (err2, stdout, stderr) {
      if (_verbose) {
        // in the future we'll allow expectations on logs and _listenOnAppLogfile will always run (remove if)
        _listenOnAppLogfile(_getAppLogfile(bundleId, stdout));
      }
      if (err2) {
        onComplete(err2);
        return;
      }
      onComplete();
    });
  });
}

function relaunchApp(onComplete) {
  if (!_currentScheme.device) {
    onComplete(new Error(`scheme.device property is missing, should hold the device type we test on`));
    return;
  }
  if (!_currentScheme.app) {
    onComplete(new Error(`scheme.app property is missing, should hold the app binary path`));
    return;
  }
  _relaunchApp(_currentScheme.device, _currentScheme.app, function (err) {
    if (err) {
      onComplete(err);
      return;
    }
    _waitUntilReady(function () {
      onComplete();
    });
  });
}

function _deleteAndRelaunchApp(device, appPath, onComplete) {
  _uninstallApp(device, appPath, function (err) {
    if (err) {
      onComplete(err);
      return;
    }
    _installApp(device, appPath, function (err2) {
      if (err2) {
        onComplete(err2);
        return;
      }
      _launchApp(device, appPath, function (err3) {
        if (err3) {
          onComplete(err3);
          return;
        }
        onComplete();
      });
    });
  });
}

function deleteAndRelaunchApp(onComplete) {
  if (!_currentScheme.device) {
    onComplete(new Error(`scheme.device property is missing, should hold the device type we test on`));
    return;
  }
  if (!_currentScheme.app) {
    onComplete(new Error(`scheme.app property is missing, should hold the app binary path`));
    return;
  }
  _deleteAndRelaunchApp(_currentScheme.device, _currentScheme.app, function (err) {
    if (err) {
      onComplete(err);
      return;
    }
    _waitUntilReady(function () {
      onComplete();
    });
  });
}

function _getQueryFromDevice(device) {
  let res = '';
  const deviceParts = device.split(',');
  for (let i = 0 ; i < deviceParts.length ; i++) res += `"${deviceParts[i].trim()}" `;
  return res.trim();
}

// ./node_modules/detox-tools/fbsimctl/fbsimctl "iPhone 5" "iOS 8.3" list
function _listSimulators(device, onComplete) {
  const query = _getQueryFromDevice(device);
  const options = {args: `${query} list`, showStdout: true};
  _executeSimulatorCommand(options, function (err) {
    if (err) {
      onComplete(err);
      return;
    }
    onComplete();
  });
}

// ./node_modules/detox-tools/fbsimctl/fbsimctl "iPhone 5" "iOS 8.3" boot
function _bootSimulator(device, onComplete) {
  const query = _getQueryFromDevice(device);
  const options = {args: `--state=shutdown --state=shutting-down ${query} boot`};
  _executeSimulatorCommand(options, function (err) {
    if (err) {
      onComplete(err);
      return;
    }
    onComplete();
  });
}

// ./node_modules/detox-tools/fbsimctl/fbsimctl "iPhone 5" "iOS 8.3" shutdown
function _shutdownSimulator(device, onComplete) {
  const query = _getQueryFromDevice(device);
  const options = {args: `--state=booted ${query} shutdown`};
  _executeSimulatorCommand(options, function (err) {
    if (err) {
      onComplete(err);
      return;
    }
    onComplete();
  });
}

// returns true if found scheme, false if no scheme found
function _setCurrentScheme(params) {
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
    _currentScheme = scheme;
    console.log('DETOX scheme:\n', scheme, '\n');
    return true;
  } else {
    return false;
  }
}

function prepare(params, onComplete) {
  _verbose = utils.getArgValue('verbose');
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
    _defaultLaunchArgs = ['-detoxServer', settings.server, '-detoxSessionId', settings.sessionId];
  } else {
    onComplete(new Error(`No session configuration was found, pass settings under the session property`));
    return;
  }
  if (_setCurrentScheme(params)) {
    if (!_currentScheme.device) {
      onComplete(new Error(`scheme.device property is missing, should hold the device type we test on`));
      return;
    }
    _listSimulators(_currentScheme.device, function (err) {
      _bootSimulator(_currentScheme.device, function (err2) {
        if (err2) {
          onComplete(err2);
          return;
        }
        deleteAndRelaunchApp(onComplete);
      });
    });
  } else {
    onComplete(new Error(`No scheme was found, in order to test a simulator pass settings under the ios-simulator property`));
    return;
  }
}

export {
  prepare,
  relaunchApp,
  deleteAndRelaunchApp,
  reloadReactNativeApp
};
