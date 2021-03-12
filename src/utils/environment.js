const fs = require('fs');
const os = require('os');
const path = require('path');
const exec = require('child-process-promise').exec;
const appdatapath = require('./appdatapath');

const DETOX_LIBRARY_ROOT_PATH = path.join(appdatapath.appDataPath(), 'Detox');
const DEVICE_LOCK_FILE_PATH = path.join(DETOX_LIBRARY_ROOT_PATH, 'device.registry.state.lock');

function getAndroidSDKPath() {
  let sdkPath = process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME;
  if (!sdkPath) {
    throw new Error(`$ANDROID_SDK_ROOT is not defined, set the path to the SDK installation directory into $ANDROID_SDK_ROOT,
    Go to https://developer.android.com/studio/command-line/variables.html for more details`);
  }
  return sdkPath;
}

function getAndroidEmulatorPath() {
  const sdkPath = getAndroidSDKPath();
  const extension = os.platform() === 'win32' ? '.exe' : '';
  const newEmulatorPath = path.join(sdkPath, 'emulator', `emulator${extension}`);
  const oldEmulatorPath = path.join(sdkPath, 'tools', `emulator${extension}`);

  return fs.existsSync(newEmulatorPath) ? newEmulatorPath : oldEmulatorPath;
}

function getDetoxVersion() {
  return require(path.join(__dirname, '../../package.json')).version;
}

async function getFrameworkPath() {
  const detoxVersion = this.getDetoxVersion();
  const sha1 = (await exec(`(echo "${detoxVersion}" && xcodebuild -version) | shasum | awk '{print $1}'`)).stdout.trim();
  return `${DETOX_LIBRARY_ROOT_PATH}/ios/${sha1}/Detox.framework`;
}

function getDetoxLibraryRootPath() {
  return DETOX_LIBRARY_ROOT_PATH;
}

function getDeviceLockFilePath() {
  return DEVICE_LOCK_FILE_PATH;
}

function getHomeDir() {
  return os.homedir();
}

module.exports = {
  getDetoxVersion,
  getFrameworkPath,
  getAndroidSDKPath,
  getAndroidEmulatorPath,
  getDetoxLibraryRootPath,
  getDeviceLockFilePath,
  getHomeDir,
};
