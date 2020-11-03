const exec = require('shell-utils').exec;
const {log, logSection, getVersionSafe, releaseNpmTag} = require('./ci.common');

function run() {
  logSection('Initializing');
  exec.execSync('lerna bootstrap --no-ci');

  const versionType = process.env.RELEASE_VERSION_TYPE;
  logSection(`Pre-calculating future version... (versionType=${versionType})`);

  const npmTag = releaseNpmTag();
  const preid = npmTag === 'latest'? '': `--preid=${npmTag}`;
  exec.execSync(`lerna version --yes ${versionType} ${preid} --no-git-tag-version --no-push`);
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
