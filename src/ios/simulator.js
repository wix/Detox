const exec = require('child_process').exec;
const path = require('path');
const fs = require('fs');
const bplist = require('bplist-parser');
const websocket = require('../websocket');

function reloadReactNativeApp(onLoad) {
  websocket.waitForNextAction('reactNativeAppLoaded', onLoad);
  websocket.sendAction('reactNativeReload');
}

function getBundleIdFromApp(appPath, onComplete) {
  const absPath = getAppAbsolutePath(appPath);
  const infoPlistPath = path.join(absPath, '/Info.plist');
  try {
    bplist.parseFile(infoPlistPath, function (err, obj) {
      if (err) throw err;
      if (Array.isArray(obj)) obj = obj[0];
      const bundleId = obj['CFBundleIdentifier'];
      if (!bundleId) throw new Error(`Field CFBundleIdentifier not found inside Info.plist of app binary at ${absPath}`);
      onComplete(null, bundleId);
    });
  } catch (e) {
    throw new Error(`Cannot read Info.plist from app binary at ${absPath}, did you build it?`);
  }
}

function executeSimulatorCommand(args, onComplete) {
  const fbsimctlPath = path.join(__dirname, '../../bin/fbsimctl/fbsimctl');
  const cmd = fbsimctlPath + ' ' + args;
  exec(cmd, function (err, stderr, stdout) {
    if (err) {
      console.log(stderr);
      throw err;
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
  const absPath = getAppAbsolutePath(appPath);
  executeSimulatorCommand(`install ${absPath}`, function (err) {
    if (err) throw err;
    onComplete();
  });
}

// ./node_modules/detox/bin/fbsimctl/fbsimctl uninstall org.reactjs.native.example.example
function uninstallApp(appPath, onComplete) {
  getBundleIdFromApp(appPath, function (err, bundleId) {
    if (err) throw err;
    executeSimulatorCommand(`uninstall ${bundleId}`, function (err2) {
      // this might fail if the app isn't installed, so don't worry about failure
      onComplete();
    });
  });
}

// ./node_modules/detox/bin/fbsimctl/fbsimctl launch org.reactjs.native.example.example
function launchApp(appPath, onComplete) {
  getBundleIdFromApp(appPath, function (err, bundleId) {
    if (err) throw err;
    executeSimulatorCommand(`launch ${bundleId}`, function (err2) {
      if (err2) throw err2;
      onComplete();
    });
  });
}

// ./node_modules/detox/bin/fbsimctl/fbsimctl relaunch org.reactjs.native.example.example
function relaunchApp(appPath, onComplete) {
  getBundleIdFromApp(appPath, function (err, bundleId) {
    if (err) throw err;
    executeSimulatorCommand(`relaunch ${bundleId}`, function (err2) {
      if (err2) throw err2;
      onComplete();
    });
  });
}

function deleteAndRelaunchApp(appPath, onComplete) {
  uninstallApp(appPath, function (err) {
    if (err) throw err;
    installApp(appPath, function (err2) {
      if (err2) throw err2;
      launchApp(appPath, function (err3) {
        if (err3) throw err3;
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
    if (err) throw err;
    onComplete();
  });
}

// ./node_modules/detox/bin/fbsimctl/fbsimctl "iPhone 5" "iOS 8.3" shutdown
function shutdownSimulator(device, onComplete) {
  const query = getQueryFromDevice(device);
  executeSimulatorCommand(`--state=booted ${query} shutdown`, function (err) {
    if (err) throw err;
    onComplete();
  });
}

function prepare(params, onComplete) {
  let foundScheme = false;
  if (params['ios-simulator']) {
    foundScheme = true;
    const settings = params['ios-simulator'];
    if (!settings.app) throw new Error(`ios-simulator.app property is missing, should hold the app binary path`);
    if (!settings.device) throw new Error(`ios-simulator.device property is missing, should hold the device type we test on`);
    bootSimulator(settings.device, function (err) {
      if (err) throw err;
      deleteAndRelaunchApp(settings.app, function (err2) {
        if (err2) throw err2;
        onComplete();
      });
    });
  }
  if (!foundScheme) throw new Error(`No scheme was found, in order to test a simulator pass settings under the ios-simulator property`);
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
