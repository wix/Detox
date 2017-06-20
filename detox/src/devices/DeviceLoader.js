const log = require('npmlog');
const _ = require('lodash');
const exec = require('child-process-promise').exec;
const path = require('path');
const fs = require('fs');
const os = require('os');
const FBsimctl = require('./Fbsimctl');
log.level = 'verbose';

let fbsimctl = new FBsimctl();

const deviceList = ['iPhone 5s', 'iPhone 6s', 'iPhone 7 Plus'];

async function start() {

  const appPath = "ios/build/Build/Products/Release-iphonesimulator/example.app";
  const bundleId = await getBundleIdFromApp(appPath);
  _.forEach(deviceList, async(device) => {
    let simulatorUdid = await fbsimctl.list(device);
    await fbsimctl.boot(simulatorUdid);
    await fbsimctl.install(simulatorUdid, _getAppAbsolutePath(appPath));
    await fbsimctl.launch(simulatorUdid, bundleId, [])
  });
}

async function getBundleIdFromApp(appPath) {
  const absPath = _getAppAbsolutePath(appPath);
  try {
    const result = await exec(`/usr/libexec/PlistBuddy -c "Print CFBundleIdentifier" ${path.join(absPath, 'Info.plist')}`);
    return _.trim(result.stdout);
  } catch (ex) {
    throw new Error(`field CFBundleIdentifier not found inside Info.plist of app binary at ${absPath}`);
  }
}

function _getAppAbsolutePath(appPath) {
  const absPath = path.join(process.cwd(), appPath);
  if (fs.existsSync(absPath)) {
    return absPath;
  } else {
    throw new Error(`app binary not found at ${absPath}, did you build it?`);
  }
}

start();