/* tslint:disable: no-console */
const exec = require('shell-utils').exec;
const releaseDocumentation = require('releaseDocumentation');

const {log, logSection, getReleaseVersionType, isDryRun, isSkipNpm} = require('releaseArgs');

function publishNewVersion(npmTag, previousVersion) {
  validatePrerequisites();
  projectSetup();
  publishToNpm(npmTag);
  releaseDocsVersionIfNeeded(npmTag, previousVersion);
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
}

function publishToNpm(npmTag) {
  logSection('Lerna publish');
  const versionType = getReleaseVersionType();
  const dryRun = isDryRun();
  const skipNpm = isSkipNpm();
  if (dryRun) {
    log('DRY RUN: Lerna-publishing without publishing to NPM');
  }
  else if (skipNpm) {
    log('SKIP NPM is set: Lerna-publishing without publishing to NPM');
  }

  const preid = versionType.includes("pre") ? `--preid=${npmTag}` : ``;
  exec.execSync(`lerna publish ${versionType} --yes --dist-tag ${npmTag} ${preid} ${dryRun ? '--no-push': ''}  ${(dryRun || skipNpm) ? '--skip-npm' : ''} -m "Publish %v [ci skip]" --tag-version-prefix='' --force-publish=detox --loglevel trace`);
}

function releaseDocsVersionIfNeeded(npmTag, previousVersion) {
  if (npmTag !== 'latest') {
    return;
  }

  const newVersion = findCurrentPublishedVersion(npmTag);
  const shouldReplaceWithPreviousVersion = isSameMajorVersion(newVersion, previousVersion);
  releaseDocumentation.release(newVersion, shouldReplaceWithPreviousVersion ? previousVersion : undefined);
}

function findCurrentPublishedVersion(npmTag) {
  return exec.execSyncRead(`npm view detox dist-tags.${npmTag}`);
}

function isSameMajorVersion(newVersion, previousVersion) {
  const newMajor = newVersion.substring(newVersion.indexOf(".") + 1);
  const previousMajor = previousVersion.substring(previousVersion.indexOf(".") + 1);
  return newMajor === previousMajor;
}

module.exports = publishNewVersion;
