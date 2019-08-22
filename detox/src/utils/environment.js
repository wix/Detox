const fs = require('fs');
const os = require('os');
const path = require('path');
const which = require('which');
const exec = require('child-process-promise').exec;
const appdatapath = require('./appdatapath');

const DETOX_LIBRARY_ROOT_PATH = path.join(appdatapath.appDataPath(), 'Detox');
const DEVICE_LOCK_FILE_PATH = path.join(
  DETOX_LIBRARY_ROOT_PATH,
  'device.registry.state.lock',
);
const MISSING_SDK_ERROR = `$ANDROID_SDK_ROOT is not defined, set the path to the SDK installation directory into $ANDROID_SDK_ROOT,
Go to https://developer.android.com/studio/command-line/variables.html for more details`;

function getAndroidSDKPath() {
  return process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME || '';
}

function getAndroidEmulatorPath(){
  const sdkPath = getAndroidSDKPath();
  const newEmulatorDir = path.join(sdkPath, 'emulator');
  const oldEmulatorDir = path.join(sdkPath, 'tools');
  const emulator =
    which.sync('emulator', {path: newEmulatorDir, nothrow: true}) ||
    which.sync('emulator', {path: oldEmulatorDir, nothrow: true}) ||
    which.sync('emulator', {nothrow: true});

  if (emulator == null) {
    throw new Error(MISSING_SDK_ERROR);
  }

  return emulator
}

async function getAaptPath(){
  const sdkPath = getAndroidSDKPath();

  let latestBuildToolsVersion = '';

  const buildToolsDir = path.join(sdkPath, 'build-tools');
  if (fs.pathExistsSync(buildToolsDir)) {
    const buildToolsDirs = await fsext.getDirectories(buildToolsDir);
    latestBuildToolsVersion = _.last(buildToolsDirs);
  }

  const buildToolsDirLatestVersion = path.join(
    sdkPath,
    'build-tools',
    latestBuildToolsVersion,
  );

  const aaptBin =
    which.sync('aapt', {path: buildToolsDirLatestVersion, nothrow: true}) ||
    which.sync('aapt', {nothrow: true});

  if (aaptBin == null) {
    throw new Error(MISSING_SDK_ERROR);
  }
  return aaptBin
}

function getAdbPath(){
  const platformToolsDir = path.join(getAndroidSDKPath(), 'platform-tools')
  const adbBin =
    which.sync('adb', {path: platformToolsDir, nothrow: true}) ||
    which.sync('adb', {nothrow: true});

  if (adbBin == null){
    throw new Error(MISSING_SDK_ERROR)
  }
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
  getAaptPath,
  getAdbPath,
  getDetoxVersion,
  getFrameworkPath,
  getAndroidSDKPath,
  getAndroidEmulatorPath,
  getDetoxLibraryRootPath,
  getDeviceLockFilePath,
  getHomeDir,
};
