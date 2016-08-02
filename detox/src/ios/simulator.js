const exec = require('child_process').exec;
const path = require('path');
const fs = require('fs');
const bplist = require('bplist-parser');
const websocket = require('../websocket');

// FBSimulatorControl command line docs
// https://github.com/facebook/FBSimulatorControl/issues/250
// https://github.com/facebook/FBSimulatorControl/blob/master/fbsimctl/FBSimulatorControlKitTests/Tests/Unit/CommandParsersTests.swift

let _defaultLaunchArgs = [];

function reloadReactNativeApp(onLoad) {
  websocket.waitForNextAction('reactNativeAppLoaded', onLoad);
  websocket.sendAction('reactNativeReload');
}

function getBundleIdFromApp(appPath, onComplete) {
  try {
    const absPath = getAppAbsolutePath(appPath);
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

function executeSimulatorCommand(args, onComplete) {
  const fbsimctlPath = path.join(__dirname, '../../bin/fbsimctl/fbsimctl');
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

function executeOrigSimulatorCommand(args, onComplete) {
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

function getAppAbsolutePath(appPath) {
  const absPath = path.join(__dirname, '../../../../', appPath);
  try {
    fs.accessSync(absPath, fs.F_OK);
  } catch (e) {
    throw new Error(`App binary not found at ${absPath}, did you build it?`);
  }
  return absPath;
}

// ./node_modules/detox/bin/fbsimctl/fbsimctl install ./ios/build/Build/Products/Debug-iphonesimulator/example.app
function installApp(appPath, onComplete) {
  try {
    const absPath = getAppAbsolutePath(appPath);
    executeSimulatorCommand(`install ${absPath}`, function (err) {
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

// ./node_modules/detox/bin/fbsimctl/fbsimctl uninstall org.reactjs.native.example.example
function uninstallApp(appPath, onComplete) {
  getBundleIdFromApp(appPath, function (err, bundleId) {
    if (err) {
      onComplete(err);
      return;
    }
    // it turns out that for deleting apps the orig simulator is much faster than fb's
    executeOrigSimulatorCommand(`uninstall booted ${bundleId}`, function (err2) {
      onComplete();
    });
    /*
    executeSimulatorCommand(`uninstall ${bundleId}`, function (err2) {
      // this might fail if the app isn't installed, so don't worry about failure
      onComplete();
    });
    */
  });
}

// ./node_modules/detox/bin/fbsimctl/fbsimctl launch org.reactjs.native.example.example arg1 arg2 arg3
function launchApp(appPath, onComplete) {
  getBundleIdFromApp(appPath, function (err, bundleId) {
    if (err) {
      onComplete(err);
      return;
    }
    executeSimulatorCommand(`launch ${bundleId} ${_defaultLaunchArgs.join(' ')}`, function (err2) {
      if (err2) {
        onComplete(err2);
        return;
      }
      onComplete();
    });
  });
}

// ./node_modules/detox/bin/fbsimctl/fbsimctl relaunch org.reactjs.native.example.example
function relaunchApp(appPath, onComplete) {
  getBundleIdFromApp(appPath, function (err, bundleId) {
    if (err) {
      onComplete(err);
      return;
    }
    executeSimulatorCommand(`relaunch ${bundleId} ${_defaultLaunchArgs.join(' ')}`, function (err2) {
      if (err2) {
        onComplete(err2);
        return;
      }
      onComplete();
    });
  });
}

function deleteAndRelaunchApp(appPath, onComplete) {
  uninstallApp(appPath, function (err) {
    if (err) {
      onComplete(err);
      return;
    }
    installApp(appPath, function (err2) {
      if (err2) {
        onComplete(err2);
        return;
      }
      launchApp(appPath, function (err3) {
        if (err3) {
          onComplete(err3);
          return;
        }
        onComplete();
      });
    });
  });
}

function getQueryFromDevice(device) {
  let res = '';
  const deviceParts = device.split(',');
  for (let i = 0 ; i < deviceParts.length ; i++) res += `"${deviceParts[i].trim()}" `;
  return res.trim();
}

// ./node_modules/detox/bin/fbsimctl/fbsimctl "iPhone 5" "iOS 8.3" boot
function bootSimulator(device, onComplete) {
  const query = getQueryFromDevice(device);
  executeSimulatorCommand(`--state=shutdown ${query} boot`, function (err) {
    if (err) {
      onComplete(err);
      return;
    }
    onComplete();
  });
}

// ./node_modules/detox/bin/fbsimctl/fbsimctl "iPhone 5" "iOS 8.3" shutdown
function shutdownSimulator(device, onComplete) {
  const query = getQueryFromDevice(device);
  executeSimulatorCommand(`--state=booted ${query} shutdown`, function (err) {
    if (err) {
      onComplete(err);
      return;
    }
    onComplete();
  });
}

function prepare(params, onComplete) {
  let foundScheme = false;
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
  if (params['ios-simulator']) {
    foundScheme = true;
    const settings = params['ios-simulator'];
    if (!settings.app) {
      onComplete(new Error(`ios-simulator.app property is missing, should hold the app binary path`));
      return;
    }
    if (!settings.device) {
      onComplete(new Error(`ios-simulator.device property is missing, should hold the device type we test on`));
      return;
    }
    bootSimulator(settings.device, function (err) {
      if (err) {
        onComplete(err);
        return;
      }
      deleteAndRelaunchApp(settings.app, function (err2) {
        if (err2) {
          onComplete(err2);
          return;
        }
        onComplete();
      });
    });
  }
  if (!foundScheme) {
    onComplete(new Error(`No scheme was found, in order to test a simulator pass settings under the ios-simulator property`));
    return;
  }
}

export {
  prepare,
  bootSimulator,
  shutdownSimulator,
  installApp,
  uninstallApp,
  launchApp,
  relaunchApp,
  deleteAndRelaunchApp,
  reloadReactNativeApp
};
