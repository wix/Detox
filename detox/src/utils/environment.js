const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ini = require('ini');
const _ = require('lodash');
const _which = require('which');

const DetoxRuntimeError = require('../errors/DetoxRuntimeError');

const appdatapath = require('./appdatapath');
const { execAsync } = require('./childProcess');
const fsext = require('./fsext');

function which(executable, path) {
  return _which.sync(executable, { path, nothrow: true });
}

const DETOX_LIBRARY_ROOT_PATH = path.join(appdatapath.appDataPath(), 'Detox');
const MISSING_SDK_ERROR = `$ANDROID_SDK_ROOT is not defined, set the path to the SDK installation directory into $ANDROID_SDK_ROOT,
Go to https://developer.android.com/studio/command-line/variables.html for more details`;
const DETOX_LOCK_FILE_PATH = path.join(DETOX_LIBRARY_ROOT_PATH, 'global-context.json');
const DEVICE_REGISTRY_PATH = path.join(DETOX_LIBRARY_ROOT_PATH, 'device.registry.json');
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
  return path.join(getAndroidSDKPath(), 'cmdline-tools', 'latest', 'bin', 'avdmanager');
}

function getAndroidSdkManagerPath() {
  return path.join(getAndroidSDKPath(), 'cmdline-tools', 'latest', 'bin', 'sdkmanager');
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

  throwSdkBinIntegrityError(sdkRoot, 'emulator/emulator');
}

async function getAaptPath() {
  const sdkRoot = getAndroidSDKPath();
  if (!sdkRoot) {
    return which('aapt') || throwMissingSdkError();
  }

  const latestBuildTools = await getLatestBuildToolsPath(sdkRoot);
  if (!latestBuildTools) {
    throwSdkIntegrityError('Failed to find the "aapt" tool under the Android SDK: No build-tools are installed!');
  }

  const defaultPath = which('aapt', latestBuildTools);
  if (defaultPath) {
    return defaultPath;
  }

  throwSdkToolPathError(`${latestBuildTools}/aapt`);
}

async function getLatestBuildToolsPath(sdkRoot) {
  if (!sdkRoot) {
    return '';
  }

  const buildToolsDir = path.join(sdkRoot, 'build-tools');
  if (!fs.existsSync(buildToolsDir)) {
    return '';
  }

  const buildToolsVersions = await fsext.getDirectories(buildToolsDir);
  const latestBuildToolsVersion = _.last(buildToolsVersions);
  if (!latestBuildToolsVersion) {
    return '';
  }

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

  throwSdkBinIntegrityError(sdkRoot, 'platform-tools/adb');
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
    `Failed to find AVD ${avdName} directory at path: ${avdPath}\n` + `Please verify "path" property in the INI file: ${avdIniPath}`
  );
}

function throwSdkBinIntegrityError(sdkRoot, relativeBinPath) {
  const executablePath = path.join(sdkRoot, relativeBinPath);
  throwSdkToolPathError(executablePath);
}

function throwSdkToolPathError(sdkToolPath) {
  const name = path.basename(sdkToolPath);
  const dir = path.dirname(sdkToolPath);

  throwSdkIntegrityError(`There was no "${name}" executable file in directory: ${dir}`);
}

function throwSdkIntegrityError(errMessage) {
  throw new DetoxRuntimeError(`${errMessage}\nCheck the integrity of your Android SDK.`);
}

function throwMissingGmsaasError() {
  throw new DetoxRuntimeError(
    `Failed to locate Genymotion's gmsaas executable. Please add it to your $PATH variable!\nPATH is currently set to: ${process.env.PATH}`
  );
}

const getDetoxVersion = _.once(() => {
  return require(path.join(__dirname, '../../package.json')).version;
});

const getBuildFolderName = _.once(async () => {
  const detoxVersion = getDetoxVersion();
  const xcodeVersion = await execAsync('xcodebuild -version');

  return crypto.createHash('sha1').update(`${detoxVersion}\n${xcodeVersion}\n`).digest('hex');
});

const getFrameworkDirPath = `${DETOX_LIBRARY_ROOT_PATH}/ios/framework`;

const getFrameworkPath = _.once(async () => {
  const buildFolder = await getBuildFolderName();
  return `${getFrameworkDirPath}/${buildFolder}/Detox.framework`;
});

const getXCUITestRunnerDirPath = `${DETOX_LIBRARY_ROOT_PATH}/ios/xcuitest-runner`;

const getXCUITestRunnerPath = _.once(async () => {
  const buildFolder = await getBuildFolderName();
  const derivedDataPath = `${getXCUITestRunnerDirPath}/${buildFolder}`;
  const command = `find ${derivedDataPath} -name "*.xctestrun" -print -quit`;
  const xctestrunPath = await execAsync(command);

  if (!xctestrunPath) {
    throw new DetoxRuntimeError(`Failed to find .xctestrun file in ${derivedDataPath}`);
  }

  return xctestrunPath;
});

function getDetoxLibraryRootPath() {
  return DETOX_LIBRARY_ROOT_PATH;
}

function getDetoxLockFilePath() {
  return DETOX_LOCK_FILE_PATH;
}

function getDeviceRegistryPath() {
  return DEVICE_REGISTRY_PATH;
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
  getFrameworkDirPath,
  getFrameworkPath,
  getXCUITestRunnerDirPath,
  getXCUITestRunnerPath,
  getAndroidSDKPath,
  getAndroidEmulatorPath,
  getDetoxLibraryRootPath,
  getDetoxLockFilePath,
  getDeviceRegistryPath,
  getLastFailedTestsPath,
  getHomeDir
};
