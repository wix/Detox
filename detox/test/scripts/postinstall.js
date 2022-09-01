const fs = require('fs-extra');
const path = require('path');
const semver = require('semver');

const rnVersion = function() {
  const rnPackageJson = require('react-native/package.json');
  return rnPackageJson.version;
}();

function overrideReactAndroidGradleForRn66Android() {
  const REACT_ANDROID_PATH = path.join('node_modules', 'react-native', 'ReactAndroid');
  const REACT_ANDROID_GRADLE_SCRIPT_PATH = path.join(REACT_ANDROID_PATH, 'build.gradle');
  const REACT_ANDROID_GRADLE_BAK_SCRIPT_PATH = path.join(REACT_ANDROID_PATH, 'build.gradle.bak');
  const PATCH_SCRIPT_PATH = path.join('scripts', 'ReactAndroid_rn66_build.gradle');

  console.log('  Overriding ReactAndroid\'s build.gradle...');
  try {
    fs.renameSync(REACT_ANDROID_GRADLE_SCRIPT_PATH, REACT_ANDROID_GRADLE_BAK_SCRIPT_PATH);
  } catch (e) {
    console.warn('  Couldn\'t create a backup to original script (skipping)', e);
  }
  fs.copySync(PATCH_SCRIPT_PATH, REACT_ANDROID_GRADLE_SCRIPT_PATH);
}

function overrideReactAndroidGradleForRn68Android() {
  const REACT_ANDROID_PATH = path.join('node_modules', 'react-native', 'ReactAndroid');
  const REACT_ANDROID_GRADLE_SCRIPT_PATH = path.join(REACT_ANDROID_PATH, 'build.gradle');
  const REACT_ANDROID_GRADLE_BAK_SCRIPT_PATH = path.join(REACT_ANDROID_PATH, 'build.gradle.bak');
  const PATCH_SCRIPT_PATH = path.join('scripts', 'ReactAndroid_rn68_build.gradle');

  console.log('  Overriding ReactAndroid\'s build.gradle...');
  try {
    fs.renameSync(REACT_ANDROID_GRADLE_SCRIPT_PATH, REACT_ANDROID_GRADLE_BAK_SCRIPT_PATH);
  } catch (e) {
    console.warn('  Couldn\'t create a backup to original script (skipping)', e);
  }
  fs.copySync(PATCH_SCRIPT_PATH, REACT_ANDROID_GRADLE_SCRIPT_PATH);
}

function overrideReactAndroidGradleForRn67Android() {
  const REACT_ANDROID_PATH = path.join('node_modules', 'react-native', 'ReactAndroid');
  const REACT_ANDROID_GRADLE_SCRIPT_PATH = path.join(REACT_ANDROID_PATH, 'build.gradle');
  const REACT_ANDROID_GRADLE_BAK_SCRIPT_PATH = path.join(REACT_ANDROID_PATH, 'build.gradle.bak');
  const PATCH_SCRIPT_PATH = path.join('scripts', 'ReactAndroid_rn67_build.gradle');

  console.log('  Overriding ReactAndroid\'s build.gradle...');
  try {
    fs.renameSync(REACT_ANDROID_GRADLE_SCRIPT_PATH, REACT_ANDROID_GRADLE_BAK_SCRIPT_PATH);
  } catch (e) {
    console.warn('  Couldn\'t create a backup to original script (skipping)', e);
  }
  fs.copySync(PATCH_SCRIPT_PATH, REACT_ANDROID_GRADLE_SCRIPT_PATH);
}

function overrideGradleWrapperVersion() {
  const gradleWrapperOld =
    '#!!! Patched by post-install script !!!\n' +
    '#!!! Do not commit !!!\n' +
    'distributionBase=GRADLE_USER_HOME\n' +
    'distributionPath=wrapper/dists\n' +
    'zipStoreBase=GRADLE_USER_HOME\n' +
    'zipStorePath=wrapper/dists\n' +
    'distributionUrl=https\\://services.gradle.org/distributions/gradle-6.9-all.zip\n' +
    '#!!! Do not commit !!!\n';

  const GRADLE_WRAPPER_PROPS_PATH = path.join('android', 'gradle', 'wrapper', 'gradle-wrapper.properties');

  console.log('  Patching gradle-wrapper.properties file back to gradle v6.9..');
  try {
    fs.writeFileSync(GRADLE_WRAPPER_PROPS_PATH, gradleWrapperOld);
  } catch (e) {
    console.warn('  Couldn\'t path the gradle-wrapper.properties file', e);
  }
}

function run() {
  console.log('Running Detox test-app post-install script...');

  const version = semver.minor(rnVersion);

  if (version === 66) {
    console.log('  Detected RN version .66! Applying necessary patches...');
    overrideReactAndroidGradleForRn66Android();
  }

  if (version === 67) {
    console.log('  Detected RN version .67! Applying necessary patches...');
    overrideReactAndroidGradleForRn67Android();
  }

  if (version === 68) {
    console.log('  Detected RN version .68! Applying necessary patches...');
    overrideReactAndroidGradleForRn68Android();
  }

  if (version < 68) {
    console.log('  Version is lower than 68 - Applying dedicated patches...');
    overrideGradleWrapperVersion();
  }

  console.log('Detox test-app post-install script completed!');
}

run();
