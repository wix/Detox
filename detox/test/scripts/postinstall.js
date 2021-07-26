const fs = require('fs-extra');
const path = require('path');
const semver = require('semver');

const rnVersion = function() {
  const rnPackageJson = require('react-native/package.json');
  return rnPackageJson.version;
}();

function patchHermesLocationForRN60Android() {
  const HERMES_PATH_ROOT = path.join('node_modules', 'hermesvm');
  const HERMES_PATH_RN = path.join('node_modules', 'react-native', 'node_modules', 'hermesvm');

  const hermesIsInRoot = fs.existsSync(HERMES_PATH_ROOT);
  const hermesIsInRN = fs.existsSync(HERMES_PATH_RN);

  if (hermesIsInRoot && !hermesIsInRN) {
    console.log('  Applying hermes-vm patch for RN .60...');
    fs.ensureDirSync(path.join(HERMES_PATH_RN, 'android'));
    fs.copySync(path.join(HERMES_PATH_ROOT, 'android'), path.join(HERMES_PATH_RN, 'android'));
  } else {
    console.log('  Skipping hermes-vm patching (not needed):', hermesIsInRoot, hermesIsInRN);
  }
}

/**
 * In RN .64, it seems that react-native-codegen - a proprietary code generation plugin, whose
 * native code is only available inside react-native's monorepo, has been applied.
 * This patch disables it, and that works - as long as RN is used as an .aar dep and
 * not built from source. I can't account for the latter; It is likely that with .64 it may not
 * be possible to do anymore. If ever needed, one approach to try out is to somehow build the
 * plugin ourselves through the react-native monorepo itself (onto a .jar), and then add it as a
 * direct plugin dependency into our settings.gradle (https://docs.gradle.org/current/userguide/plugins.html#sec:custom_plugin_repositories).
 */
function overrideReactAndroidGradleForRn64Android() {
  const REACT_ANDROID_PATH = path.join('node_modules', 'react-native', 'ReactAndroid');
  const REACT_ANDROID_GRADLE_SCRIPT_PATH = path.join(REACT_ANDROID_PATH, 'build.gradle');
  const REACT_ANDROID_GRADLE_BAK_SCRIPT_PATH = path.join(REACT_ANDROID_PATH, 'build.gradle.bak');
  const PATCH_SCRIPT_PATH = path.join('scripts', 'ReactAndroid_rn64_build.gradle');

  console.log('  Overriding ReactAndroid\'s build.gradle...');
  try {
    fs.renameSync(REACT_ANDROID_GRADLE_SCRIPT_PATH, REACT_ANDROID_GRADLE_BAK_SCRIPT_PATH);
  } catch (e) {
    console.warn('  Couldn\'t create a backup to original script (skipping)', e);
  }
  fs.copySync(PATCH_SCRIPT_PATH, REACT_ANDROID_GRADLE_SCRIPT_PATH);
}

function cleanFindNodeScriptFileForRn64IOS() {
  const REACT_SCRIPTS_PATH = path.join('node_modules', 'react-native', 'scripts');
  const REACT_FIND_NODE_SCRIPT_PATH = path.join(REACT_SCRIPTS_PATH, 'find-node.sh');

  console.log('  Clean content of find-node.sh file..');
  try {
    fs.writeFileSync(REACT_FIND_NODE_SCRIPT_PATH, '');
  } catch (e) {
    console.warn('  Couldn\'t clean content find-node.sh file', e);
  }
}

function run() {
  console.log('Running Detox test-app post-install script...');

  if (semver.minor(rnVersion) === 60) {
    console.log('  Detected RN version .60! Applying necessary patches...');
    patchHermesLocationForRN60Android();
  }

  if (semver.minor(rnVersion) === 64) {
    console.log('  Detected RN version .64! Applying necessary patches...');
    overrideReactAndroidGradleForRn64Android();
    cleanFindNodeScriptFileForRn64IOS();
  }

  console.log('Detox test-app post-install script completed!');
}

run();
