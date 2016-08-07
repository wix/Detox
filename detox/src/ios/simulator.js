const exec = require('child_process').exec;
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

function _waitUntilReady(onReady) {
  websocket.waitForNextAction('ready', onReady);
  websocket.sendAction('isReady');
}

function reloadReactNativeApp(onLoad) {
  websocket.waitForNextAction('reactNativeAppLoaded', onLoad);
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
        onComplete(new Error(`Field CFBundleIdentifier not found inside Info.plist of app binary at ${absPath}`));
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
function _executeSimulatorCommand(args, onComplete) {
  const fbsimctlPath = path.join(__dirname, '../../../detox-tools/fbsimctl/fbsimctl');
  const cmd = fbsimctlPath + ' ' + args;
  exec(cmd, function (err, stderr, stdout) {
    if (err) {
      console.log(stderr);
      onComplete(err);
      return;
    }
    onComplete();
  });
}

// original simctl by Apple (we try to use it only where fbsimctl doesn't work or is very slow)
function _executeOrigSimulatorCommand(args, onComplete) {
  const cmd = 'xcrun simctl ' + args;
  exec(cmd, function (err, stderr, stdout) {
    if (err) {
      console.log(stderr);
      onComplete(err);
      return;
    }
    onComplete();
  });
}

function _getAppAbsolutePath(appPath) {
  const absPath = path.join(__dirname, '../../../../', appPath);
  try {
    fs.accessSync(absPath, fs.F_OK);
  } catch (e) {
    throw new Error(`App binary not found at ${absPath}, did you build it?`);
  }
  return absPath;
}

// ./node_modules/detox-tools/fbsimctl/fbsimctl install ./ios/build/Build/Products/Debug-iphonesimulator/example.app
function _installApp(appPath, onComplete) {
  try {
    const absPath = _getAppAbsolutePath(appPath);
    _executeSimulatorCommand(`install ${absPath}`, function (err) {
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
function _uninstallApp(appPath, onComplete) {
  _getBundleIdFromApp(appPath, function (err, bundleId) {
    if (err) {
      onComplete(err);
      return;
    }
    // it turns out that for deleting apps the orig simulator is much faster than fb's
    _executeOrigSimulatorCommand(`uninstall booted ${bundleId}`, function (err2) {
      onComplete();
    });
    /*
    _executeSimulatorCommand(`uninstall ${bundleId}`, function (err2) {
      // this might fail if the app isn't installed, so don't worry about failure
      onComplete();
    });
    */
  });
}

// ./node_modules/detox-tools/fbsimctl/fbsimctl launch org.reactjs.native.example.example arg1 arg2 arg3
function _launchApp(appPath, onComplete) {
  _getBundleIdFromApp(appPath, function (err, bundleId) {
    if (err) {
      onComplete(err);
      return;
    }
    _executeSimulatorCommand(`launch ${bundleId} ${_defaultLaunchArgs.join(' ')}`, function (err2) {
      if (err2) {
        onComplete(err2);
        return;
      }
      onComplete();
    });
  });
}

// ./node_modules/detox-tools/fbsimctl/fbsimctl relaunch org.reactjs.native.example.example
function _relaunchApp(appPath, onComplete) {
  _getBundleIdFromApp(appPath, function (err, bundleId) {
    if (err) {
      onComplete(err);
      return;
    }
    _executeSimulatorCommand(`relaunch ${bundleId} ${_defaultLaunchArgs.join(' ')}`, function (err2) {
      if (err2) {
        onComplete(err2);
        return;
      }
      onComplete();
    });
  });
}

function relaunchApp(onComplete) {
  if (!_currentScheme.app) {
    onComplete(new Error(`scheme.app property is missing, should hold the app binary path`));
    return;
  }
  _relaunchApp(_currentScheme.app, function (err) {
    if (err) {
      onComplete(err);
      return;
    }
    _waitUntilReady(function () {
      onComplete();
    });
  });
}

function _deleteAndRelaunchApp(appPath, onComplete) {
  _uninstallApp(appPath, function (err) {
    if (err) {
      onComplete(err);
      return;
    }
    _installApp(appPath, function (err2) {
      if (err2) {
        onComplete(err2);
        return;
      }
      _launchApp(appPath, function (err3) {
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
  if (!_currentScheme.app) {
    onComplete(new Error(`scheme.app property is missing, should hold the app binary path`));
    return;
  }
  _deleteAndRelaunchApp(_currentScheme.app, function (err) {
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

// ./node_modules/detox-tools/fbsimctl/fbsimctl "iPhone 5" "iOS 8.3" boot
function _bootSimulator(device, onComplete) {
  const query = _getQueryFromDevice(device);
  _executeSimulatorCommand(`--state=shutdown ${query} boot`, function (err) {
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
  _executeSimulatorCommand(`--state=booted ${query} shutdown`, function (err) {
    if (err) {
      onComplete(err);
      return;
    }
    onComplete();
  });
}

// returns undefined if not found
function _getArgValue(key) {
  for (let i = 0; i < process.argv.length ; i++) {
    if (process.argv[i].startsWith(`--${key}=`)) {
      return process.argv[i].split('=')[1];
    }
  }
  return undefined;
}

// returns true if found scheme, false if no scheme found
function _setCurrentScheme(params) {
  let scheme;
  const schemeOverride = _getArgValue('detoxScheme');
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
    _bootSimulator(_currentScheme.device, function (err) {
      if (err) {
        onComplete(err);
        return;
      }
      deleteAndRelaunchApp(onComplete);
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
