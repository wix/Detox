/* tslint:disable: no-console */
const exec = require('shell-utils').exec;

const {log, getVersionSafe} = require('./ci.common');

function publishNewVersion(packageVersion) {
  validatePublishConfig();

  lernaBootstrap();
  prePublishToNpm();
  publishToNpm();
  const newVersion = getVersionSafe();
  if (newVersion === packageVersion) {
    log(`Stopping: Lerna\'s completed without upgrading the version - nothing to publish (version is ${npmVersion})`);
    return false;
  }

  generateChangeLog(newVersion);
  updateGit(newVersion);
  return true;
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

function lernaBootstrap() {
  log('*** Lerna bootstap ***');
  exec.execSync(`lerna bootstrap`);
}

function prePublishToNpm() {
  log('*** Pre-publish ***');

  const baseDir = process.cwd();
  process.chdir(baseDir + '/detox');
  const {packageIosSources} = require('../detox/scripts/pack_ios');
  packageIosSources();
  process.chdir(baseDir);
}

function publishToNpm() {
  log('*** Lerna publish ***');

  const versionType = process.env.RELEASE_VERSION_TYPE;

  exec.execSync(`lerna publish --cd-version "${versionType}" --yes --skip-git`);
  exec.execSync('git status');
}

function generateChangeLog(newVersion) {
  log('*** Changelog generator ***');

  const gitToken = process.env.CHANGELOG_GITHUB_TOKEN;
  exec.execSyncSilent(`CHANGELOG_GITHUB_TOKEN=${gitToken} github_changelog_generator --future-release "${newVersion}" --no-verbose`);
}

function updateGit(newVersion) {
  log('*** Packing changes up onto a git commit... ***');
  exec.execSync(`git add -u`);
  exec.execSync(`git commit -m "[ci skip] Publish $VERSION"`);
  exec.execSync(`git tag ${newVersion}`);
  exec.execSync(`git push deploy master`);
  exec.execSync(`git push --tags deploy master`);
}

module.exports = publishNewVersion;
