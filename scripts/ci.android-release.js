const exec = require('shell-utils').exec;
const {log, logSection, getVersionSafe} = require('./ci.common');

function run() {
  logSection('Initializing');
  exec.execSync('lerna bootstrap');

  const versionType = process.env.RELEASE_VERSION_TYPE;
  logSection(`Pre-calculating future version... (versionType=${versionType})`);
  exec.execSync(`lerna publish --cd-version "${versionType}" --yes --skip-git --skip-npm`);
  const futureVersion = getVersionSafe();
  log('Version is: ' + futureVersion);
  exec.execSync('git reset --hard');

  logSection('Packing up Android artifacts...');
  log('Accepting all Android SDK licenses...');
  exec.execSync(`yes | ${process.env.ANDROID_HOME}/tools/bin/sdkmanager --licenses`);
  process.chdir('detox/android');
  exec.execSync(`./gradlew clean detox:publish -Dversion=${futureVersion}`);
  process.chdir('../..');
}

run();
