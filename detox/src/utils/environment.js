const _ = require('lodash');
const fs = require('fs');
const os = require('os');
const path = require('path');
const _which = require('which');
const exec = require('child-process-promise').exec;
const appdatapath = require('./appdatapath');
const fsext = require('./fsext');

function which(executable, path) {
  return _which.sync(executable, {path, nothrow: true});
}

const DETOX_LIBRARY_ROOT_PATH = path.join(appdatapath.appDataPath(), 'Detox');
const MISSING_SDK_ERROR = `$ANDROID_SDK_ROOT is not defined, set the path to the SDK installation directory into $ANDROID_SDK_ROOT,
Go to https://developer.android.com/studio/command-line/variables.html for more details`;
const DEVICE_LOCK_FILE_PATH_IOS = path.join(DETOX_LIBRARY_ROOT_PATH, 'device.registry.state.lock');
const DEVICE_LOCK_FILE_PATH_ANDROID = path.join(DETOX_LIBRARY_ROOT_PATH, 'android-device.registry.state.lock');

function getAndroidSDKPath() {
  return process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME || '';
}

function getAndroidEmulatorPath() {
  const sdkRoot = getAndroidSDKPath();
  if (!sdkRoot) {
    return which('emulator') || throwMissingSdkError();
  }

  const defaultPath = which('emulator', path.join(sdkRoot, 'emulator'));
  if (defaultPath) {
    return defaultPath;
  }

  const legacyPath = which('emulator', path.join(sdkRoot, 'tools'));
  if (legacyPath) {
    return legacyPath;
  }

  throwSdkIntegrityError(sdkRoot, 'emulator/emulator');
}

async function getAaptPath() {
  const sdkRoot = getAndroidSDKPath();
  if (!sdkRoot) {
    return which('aapt') || throwMissingSdkError();
  }

  const latestBuildTools = await getLatestBuildToolsPath(sdkRoot);
  const defaultPath = latestBuildTools && which('aapt', latestBuildTools);
  if (defaultPath) {
    return defaultPath;
  }

  throwSdkIntegrityError(sdkRoot, `${latestBuildTools}/aapt`);
}

async function getLatestBuildToolsPath(sdkRoot) {
  if (!sdkRoot) return '';

  const buildToolsDir = path.join(sdkRoot, 'build-tools');
  if (!fs.existsSync(buildToolsDir)) return '';

  const buildToolsVersions = await fsext.getDirectories(buildToolsDir);
  const latestBuildToolsVersion = _.last(buildToolsVersions);
  if (!latestBuildToolsVersion) return '';

  return path.join(buildToolsDir, latestBuildToolsVersion);
}

function getAdbPath() {
  const sdkRoot = getAndroidSDKPath();
  if (!sdkRoot) {
    return which('adb') || throwMissingSdkError();
  }

  const defaultPath = which('adb', path.join(sdkRoot, 'platform-tools'));
  if (defaultPath) {
    return defaultPath;
  }

  throwSdkIntegrityError(sdkRoot, 'platform-tools/adb');
}

function throwMissingSdkError() {
    throw new Error(MISSING_SDK_ERROR);
}

function throwSdkIntegrityError(sdkRoot, relativeExecutablePath) {
  const executablePath = path.join(sdkRoot, relativeExecutablePath);
  const name = path.basename(executablePath);
  const dir = path.dirname(executablePath);

  throw new Error(
    `There was no "${name}" executable file in directory: ${dir}.\n` +
    `Check integrity of your Android SDK.`
  );
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

function getDeviceLockFilePathIOS() {
  return DEVICE_LOCK_FILE_PATH_IOS;
}

function getDeviceLockFilePathAndroid() {
  return DEVICE_LOCK_FILE_PATH_ANDROID;
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
  getDeviceLockFilePathIOS,
  getDeviceLockFilePathAndroid,
  getHomeDir,
};
