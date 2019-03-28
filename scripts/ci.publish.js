/* tslint:disable: no-console */
const exec = require('shell-utils').exec;

const {log, logSection, getVersionSafe} = require('./ci.common');

function publishNewVersion(packageVersion) {
  validatePrerequisites();
  projectSetup();
  prePublishToNpm();
  publishToNpm();
  const newVersion = getVersionSafe();
  if (newVersion === packageVersion) {
    log(`Stopping: Lerna\'s completed without upgrading the version - nothing to publish (version is ${newVersion})`);
    return false;
  }

  generateChangeLog(newVersion);
  updateGit(newVersion);
  return true;
}

function validatePrerequisites() {
  const lernaBin = exec.which('lerna');
  if (!lernaBin) {
    throw new Error(`Cannot publish: lerna not installed!`);
  }

  const lernaVersion = exec.execSyncRead('lerna --version');
  if (!lernaVersion.startsWith('2.')) {
    throw new Error(`Cannot publish: lerna version isn't 2.x.x (actual version is ${lernaVersion})`);
  }

  const changelogGenerator = exec.which('github_changelog_generator');
  if (!changelogGenerator) {
    throw new Error(`Cannot publish: Github change-log generator not installed (see https://github.com/github-changelog-generator/github-changelog-generator#installation for more details`);
  }

  if (!process.env.CHANGELOG_GITHUB_TOKEN) {
    throw new Error(`Cannot publish: Github token for change-log generator hasn't been specified (see https://github.com/github-changelog-generator/github-changelog-generator#github-token for more details)`);
  }
}

function projectSetup() {
  logSection('Project setup');
  exec.execSync(`lerna bootstrap`);
  exec.execSync(`git checkout master`);
}

function prePublishToNpm() {
  logSection('Prepublish');

  process.chdir('detox');
  const {packageIosSources} = require('../detox/scripts/pack_ios');
  packageIosSources();
  process.chdir('..');
}

function publishToNpm() {
  logSection('Lerna publish');

  const versionType = process.env.RELEASE_VERSION_TYPE;

  exec.execSync(`lerna publish --cd-version "${versionType}" --yes --skip-git`);
  exec.execSync('git status');
}

function generateChangeLog(newVersion) {
  logSection('Changelog generator');

  const gitToken = process.env.CHANGELOG_GITHUB_TOKEN;
  exec.execSyncSilent(`CHANGELOG_GITHUB_TOKEN=${gitToken} LANG=en_US.UTF-8 LANGUAGE=en_US.UTF-8 LC_ALL=en_US.UTF-8 github_changelog_generator --future-release "${newVersion}" --no-verbose`);
  exec.execSync('git status');
}

function updateGit(newVersion) {
  logSection('Packing changes up onto a git commit');
  exec.execSync(`git add -u`);
  exec.execSync(`git commit -m "Publish ${newVersion} [ci skip]"`);
  exec.execSync(`git tag ${newVersion}`);
  exec.execSync(`git log -1 --date=short --pretty=format:'%h %ad %s %d %cr %an'`);
  exec.execSync(`git push deploy master`);
  exec.execSync(`git push --tags deploy master`);
}

module.exports = publishNewVersion;
