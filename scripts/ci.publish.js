/* tslint:disable: no-console */
const exec = require('shell-utils').exec;

const {log, logSection, getReleaseVersionType, getDryRun, getSkipNpm} = require('./ci.common');

function publishNewVersion(npmTag) {
  validatePrerequisites();
  projectSetup();
  publishToNpm(npmTag);
}

function validatePrerequisites() {
  const lernaBin = exec.which('lerna');
  if (!lernaBin) {
    throw new Error(`Cannot publish: lerna not installed!`);
  }
}

function projectSetup() {
  logSection('Project setup');
  exec.execSync(`git checkout ${process.env.BUILDKITE_BRANCH}`);
  // exec.execSync(`lerna bootstrap --no-ci --loglevel verebose`);
}

function publishToNpm(npmTag) {
  logSection('Lerna publish');
  console.log(`Publishing with tag: ${npmTag}`);
  const versionType = getReleaseVersionType();
  const dryRun = getDryRun() === "true";
  const skipNpm = getSkipNpm() === "true";
  if (dryRun) {
    log('DRY RUN: Lerna-publishing without publishing to NPM');
  }
  else if (skipNpm) {
    log('SKIP NPM is set: Lerna-publishing without publishing to NPM');
  }
  const preid = npmTag === 'latest'? '': `--preid=${npmTag}`;
  exec.execSync(`lerna publish ${versionType} --yes --dist-tag ${npmTag} ${preid} ${dryRun ? '--no-push': ''}  ${(dryRun || skipNpm) ? '--skip-npm' : ''} -m "Publish %v [ci skip]" --tag-version-prefix='' --force-publish=detox --loglevel trace`);
}

module.exports = publishNewVersion;
