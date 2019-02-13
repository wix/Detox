/* tslint:disable: no-console */
const exec = require('shell-utils').exec;
const semver = require('semver');

function publishNewVersion(packageVersion) {
  installLernaIfNeeded();
  validatePublishConfig();

  const newVersion = publishToNpm();
  if (newVersion === packageVersion) {
    log('Stopping: Lerna\'s completed without upgrading the version (nothing to publish)');
    return false;
  }

  generateChangeLog(newVersion);
  updateGit(newVersion);
  return true;
}

function installLernaIfNeeded() {
  if (!exec.which('lerna')) {
    exec.execSync(`npm install --global lerna@2.11.0`);
  }
}

function validatePublishConfig() {
  const lernaVersion = exec.execSyncRead('lerna --version');
  if (!lernaVersion.startsWith('2.')) {
    throw new Error(`Cannot publish: lerna version isn't 2.x.x (actual version is ${lernaVersion})`);
  }

  const changelogGenerator = exec.which(`github_changelog_generator`);
  if (!changelogGenerator) {
    throw new Error(`Cannot publish: Github change-log generator not installed (see https://github.com/github-changelog-generator/github-changelog-generator#installation for more details`);
  }

  if (!process.env.CHANGELOG_GITHUB_TOKEN) {
    throw new Error(`Cannot publish: Github token for change-log generator hasn't been specified (see https://github.com/github-changelog-generator/github-changelog-generator#github-token for more details)`);
  }
}

function publishToNpm() {
  const versionType = process.env.RELEASE_VERSION_TYPE;
  const lernaResult = exec.execSyncRead(`lerna publish --cd-version "${versionType}" --yes --skip-git`);
  log('(DEBUG) Result from Lerna:', lernaResult);

  exec.execSync('git status');

  return getVersion();
}

function generateChangeLog(newVersion) {
  log('Starting changelog generator...');
  exec.execSync(`github_changelog_generator --future-release "${newVersion}" --no-verbose`);
}

function updateGit(newVersion) {
  log('Packing changes up onto a git commit...');
  exec.execSync(`git add -A`);
  exec.execSync(`git commit -m "[skip ci] Publish $VERSION"`);
  exec.execSync(`git tag ${newVersion}`);
  exec.execSync(`git push deploy`);
  exec.execSync(`git push --tags deploy`);
}

function getVersion() {
  const version = semver.clean(require('../detox/package.json').version);
  if (!version) {
    throw new Error('Error: failed to read version from package.json!');
  }
  return version;
}

module.exports = publishNewVersion;
