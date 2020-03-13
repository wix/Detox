/* tslint:disable: no-console */
const exec = require('shell-utils').exec;

const {log, logSection, getVersionSafe} = require('./ci.common');

function publishNewVersion(packageVersion) {
  validatePrerequisites();
  projectSetup();
  publishToNpm();

  const newVersion = getVersionSafe();
  if (newVersion === packageVersion) {
    log(`Stopping: Lerna\'s completed without upgrading the version - nothing to publish (version is ${newVersion})`);
    return false;
  }

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
}

function projectSetup() {
  logSection('Project setup');
  exec.execSync(`lerna bootstrap`);
  exec.execSync(`git checkout master`);
}

function publishToNpm() {
  logSection('Lerna publish');

  const versionType = process.env.RELEASE_VERSION_TYPE;
  const dryRun = process.env.RELEASE_DRY_RUN === "true";
  const skipNpm = process.env.RELEASE_SKIP_NPM === "true";
  if (dryRun) {
    log('DRY RUN: Lerna-publishing without publishing to NPM');
  }
  else if (skipNpm) {
    log('SKIP NPM is set: Lerna-publishing without publishing to NPM');
  }

  exec.execSync(`lerna publish --cd-version "${versionType}" --yes --skip-git ${(dryRun || skipNpm) ? '--skip-npm' : ''}`);
  exec.execSync('git status');
}

function updateGit(newVersion) {
  logSection('Packing changes up onto a git commit');
  exec.execSync(`git add -u`);
  exec.execSync(`git commit -m "Publish ${newVersion} [ci skip]"`);
  exec.execSync(`git tag ${newVersion}`);
  exec.execSync(`git log -1 --date=short --pretty=format:'%h %ad %s %d %cr %an'`);

  const dryRun = process.env.RELEASE_DRY_RUN === "true";
  if (dryRun) {
    log('DRY RUN: not pushing to git');
  } else {
    exec.execSync(`git push deploy master`);
    exec.execSync(`git push --tags deploy master`);
  }
}

module.exports = publishNewVersion;
