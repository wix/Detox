const exec = require('shell-utils').exec;
const {log, logSection, getVersionSafe, getReleaseNpmTag, getReleaseVersionType} = require('./utils/releaseArgs');

function run() {
  logSection('Initializing');
  exec.execSync('bash scripts/change_all_react_native_versions.sh')
  exec.execSync('lerna bootstrap --no-ci');

  const versionType = getReleaseVersionType();
  logSection(`Pre-calculating future version... (versionType=${versionType})`);

  const npmTag = getReleaseNpmTag();
  const preid = npmTag === 'latest'? '': `--preid=${npmTag}`;
  exec.execSync(`lerna version --yes ${versionType} ${preid} --no-git-tag-version --force-publish=detox --no-push`);
  const futureVersion = getVersionSafe();
  log('Version is: ' + futureVersion);
  
  logSection('Packing up Android artifacts...');
  log('Accepting all Android SDK licenses...');
  exec.execSync(`yes | ${process.env.ANDROID_HOME}/cmdline-tools/latest/bin/sdkmanager --licenses`);
  process.chdir('detox/android');
  exec.execSync(`./gradlew clean detox:publish -Dversion=${futureVersion}`);
  process.chdir('../Detox-android/');
  exec.execSync(`tar -zcf ARCHIVE_${futureVersion}.tgz *`);
  process.chdir(`../../`);
}

run();
