/* tslint:disable: no-console */
const exec = require('shell-utils').exec;

const {
  log,
  logSection,
  getReleaseNpmTag,
  getReleaseVersionType,
  getVersionSafe,
  isDryRun,
  isSkipNpm
} = require('./releaseArgs');

const {removeDocsForVersion, buildDocsForVersion} = require('./releaseDocumentation');

function publishNewVersion() {
  validatePrerequisites();
  projectSetup();

  const releaseTag = getReleaseNpmTag();
  const currentVersion = queryNpmVersionByTag(releaseTag);
  log(`    current published version on tag ${releaseTag}: ${currentVersion || 'N/A'}`);

  publishToNpm(releaseTag);

  const newVersion = getVersionSafe();
  log(`    new published version on tag ${releaseTag}: ${newVersion}`);

  if (releaseTag === 'latest') {
    releaseDocsVersion(newVersion, currentVersion);
  }
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

function releaseDocsVersion(newVersion, previousVersion) {
  const newDocsVersion = newVersion.split('.', 1).concat('.x').join('');
  const previousDocsVersion = previousVersion.split('.', 1).concat('.x').join('');

  if (newDocsVersion === previousDocsVersion) {
    removeDocsForVersion(previousDocsVersion);
  }

  buildDocsForVersion(newDocsVersion);
}

function queryNpmVersionByTag(npmTag) {
  return exec.execSyncRead(`npm view detox dist-tags.${npmTag}`).trim();
}

module.exports = publishNewVersion;
