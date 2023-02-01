const fs = require('fs-extra');
const path = require('path');
const semver = require('semver');

const rnVersion = function() {
  const rnPackageJson = require('react-native/package.json');
  return rnPackageJson.version;
}();

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

  console.log('[POST-INSTALL]  Patching gradle-wrapper.properties file back to gradle v6.9..');
  try {
    fs.writeFileSync(GRADLE_WRAPPER_PROPS_PATH, gradleWrapperOld);
  } catch (e) {
    console.warn('[POST-INSTALL]  Couldn\'t path the gradle-wrapper.properties file', e);
  }
}

function run() {
  console.log('[POST-INSTALL] Running Detox\'s test-app post-install script...');

  const version = semver.minor(rnVersion);

  if (version < 68) {
    console.log(`[POST-INSTALL]  RN Version ${version} is lower than 68 - Applying dedicated patches...`);
    overrideGradleWrapperVersion();
  }

  console.log('[POST-INSTALL] Completed!');
}

run();
