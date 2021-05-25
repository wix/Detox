const fs = require('fs');
const os = require('os');
const path = require('path');

const exec = require('child-process-promise').exec;
const ini = require('ini');
const _ = require('lodash');
const _which = require('which');

const DetoxRuntimeError = require('../errors/DetoxRuntimeError');

const appdatapath = require('./appdatapath');
const fsext = require('./fsext');

function which(executable, path) {
  return _which.sync(executable, { path, nothrow: true });
}

const DETOX_LIBRARY_ROOT_PATH = path.join(appdatapath.appDataPath(), 'Detox');
const MISSING_SDK_ERROR = `$ANDROID_SDK_ROOT is not defined, set the path to the SDK installation directory into $ANDROID_SDK_ROOT,
Go to https://developer.android.com/studio/command-line/variables.html for more details`;
const DEVICE_LOCK_FILE_PATH_IOS = path.join(DETOX_LIBRARY_ROOT_PATH, 'device.registry.state.lock');
const DEVICE_LOCK_FILE_PATH_ANDROID = path.join(DETOX_LIBRARY_ROOT_PATH, 'android-device.registry.state.lock');
const GENYCLOUD_GLOBAL_CLEANUP_FILE_PATH = path.join(DETOX_LIBRARY_ROOT_PATH, 'genycloud-cleanup.lock');
const LAST_FAILED_TESTS_PATH = path.join(DETOX_LIBRARY_ROOT_PATH, 'last-failed.txt');

function getAndroidSDKPath() {
  return process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME || '';
}

function getAndroidSDKHome() {
  return process.env['ANDROID_SDK_HOME'] || os.homedir();
}

function getEmulatorHome() {
  return process.env['ANDROID_EMULATOR_HOME'] || path.join(getAndroidSDKHome(), '.android');
}

function getAvdHome() {
  return process.env['ANDROID_AVD_HOME'] || path.join(getEmulatorHome(), 'avd');
}

function getAvdDir(avdName) {
  const avdIniPath = path.join(getAvdHome(), `${avdName}.ini`);
  if (!fs.existsSync(avdIniPath)) {
    throwMissingAvdINIError(avdName, avdIniPath);
  }

  const avdIni = ini.parse(fs.readFileSync(avdIniPath, 'utf-8'));
  if (!fs.existsSync(avdIni.path)) {
    throwMissingAvdError(avdName, avdIni.path, avdIniPath);
  }

  return avdIni.path;
}

function getAvdManagerPath() {
  return path.join(getAndroidSDKPath(), 'tools', 'bin', 'avdmanager');
}

function getAndroidSdkManagerPath() {
  return path.join(getAndroidSDKPath(), 'tools', 'bin', 'sdkmanager');
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

function getGmsaasPath() {
  return which('gmsaas') || throwMissingGmsaasError();
}

function throwMissingSdkError() {
  throw new DetoxRuntimeError(MISSING_SDK_ERROR);
}

function throwMissingAvdINIError(avdName, avdIniPath) {
  throw new DetoxRuntimeError(`Failed to find INI file for ${avdName} at path: ${avdIniPath}`);
}

function throwMissingAvdError(avdName, avdPath, avdIniPath) {
  throw new DetoxRuntimeError(
    `Failed to find AVD ${avdName} directory at path: ${avdPath}\n` +
    `Please verify "path" property in the INI file: ${avdIniPath}`
  );
}

function throwSdkIntegrityError(sdkRoot, relativeExecutablePath) {
  const executablePath = path.join(sdkRoot, relativeExecutablePath);
  const name = path.basename(executablePath);
  const dir = path.dirname(executablePath);

  throw new DetoxRuntimeError(
    `There was no "${name}" executable file in directory: ${dir}.\n` +
    `Check integrity of your Android SDK.`
  );
}

function throwMissingGmsaasError() {
  throw new DetoxRuntimeError(`Failed to locate Genymotion's gmsaas executable. Please add it to your $PATH variable!\nPATH is currently set to: ${process.env.PATH}`);
}

function getDetoxVersion() {
  return require(path.join(__dirname, '../../package.json')).version;
}

let _iosFrameworkPath;
async function getFrameworkPath() {
  if (!_iosFrameworkPath) {
    _iosFrameworkPath = _doGetFrameworkPath();
  }

  return _iosFrameworkPath;
}

async function _doGetFrameworkPath() {
  const detoxVersion = getDetoxVersion();
  const sha1 = (await exec(`(echo "${detoxVersion}" && xcodebuild -version) | shasum | awk '{print $1}'`)).stdout.trim();
  return `${DETOX_LIBRARY_ROOT_PATH}/ios/${sha1}/Detox.framework`;
}

function getDetoxLibraryRootPath() {
  return DETOX_LIBRARY_ROOT_PATH;
}

function getDeviceLockFilePathIOS() {
  return DEVICE_LOCK_FILE_PATH_IOS;
}

// TODO This can probably be merged with IOS' by now
function getDeviceLockFilePathAndroid() {
  return DEVICE_LOCK_FILE_PATH_ANDROID;
}

function getGenyCloudGlobalCleanupFilePath() {
  return GENYCLOUD_GLOBAL_CLEANUP_FILE_PATH;
}

function getLastFailedTestsPath() {
  return LAST_FAILED_TESTS_PATH;
}

function getHomeDir() {
  return os.homedir();
}

module.exports = {
  getAaptPath,
  getAdbPath,
  getAvdHome,
  getAvdDir,
  getAvdManagerPath,
  getAndroidSdkManagerPath,
  getGmsaasPath,
  getDetoxVersion,
  getFrameworkPath,
  getAndroidSDKPath,
  getAndroidEmulatorPath,
  getDetoxLibraryRootPath,
  getDeviceLockFilePathIOS,
  getDeviceLockFilePathAndroid,
  getGenyCloudGlobalCleanupFilePath,
  getLastFailedTestsPath,
  getHomeDir,
};
