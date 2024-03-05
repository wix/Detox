/* tslint:disable: no-console */
const semver = require('semver');
const fs = require('fs');
const chalk = require('chalk');
const cp = require('child_process');

const log = (...args) => console.log('[RELEASE]', ...args);
const logSection = (message) => console.log(chalk.blue(`[RELEASE] ${message}`));

// Export buildkite variables for Release build
// We cast toString() because 'buildkite-agent meta-data get' function returns 'object'
const BRANCH = process.env.BUILDKITE_BRANCH;
const RELEASE = process.env.BUILDKITE_MESSAGE.match(/^release$/i);
let RELEASE_VERSION_TYPE, RELEASE_NPM_TAG, RELEASE_DRY_RUN, RELEASE_SKIP_NPM, PRE_RELEASE;
if (RELEASE) {
  RELEASE_VERSION_TYPE = cp.execSync(`buildkite-agent meta-data get release-version-type`).toString();
  RELEASE_SKIP_NPM = cp.execSync(`buildkite-agent meta-data get release-skip-npm`).toString();
  RELEASE_DRY_RUN = cp.execSync(`buildkite-agent meta-data get release-dry-run`).toString();
  RELEASE_NPM_TAG = cp.execSync(`buildkite-agent meta-data get release-npm-tag`).toString();
  PRE_RELEASE = cp.execSync(`buildkite-agent meta-data get pre-release`).toString();
}

function isRelease() {
  return RELEASE;
}

function getReleaseVersionType() {
  return (isPreRelease() ? 'pre' : '') + RELEASE_VERSION_TYPE;
}

function isPreRelease() {
  return PRE_RELEASE === 'true';
}
function isSkipNpm() {
  return RELEASE_SKIP_NPM === 'true';
}

function isDryRun() {
  return RELEASE_DRY_RUN === 'true';
}

function getPackageJsonPath() {
  return `${process.cwd()}/detox/package.json`;
}

function readPackageJson() {
  return JSON.parse(fs.readFileSync(getPackageJsonPath()));
}

function getVersionSafe() {
  const version = semver.clean(readPackageJson().version);
  if (!version) {
    throw new Error('Error: failed to read version from package.json!');
  }
  return version;
}

// If theres a npm tag, use it. Otherwise, if releasing from `master` branch, use a `prerelease` prefix for
// pre-releases, and "latest" otherwise, for non-master branches uses `next` if from the `next` branch and `smoke`
// otherwise.
function getReleaseNpmTag() {
  if (RELEASE_NPM_TAG !== 'null') {
    return RELEASE_NPM_TAG;
  } else if (BRANCH === 'master') {
    return isPreRelease() ? 'prerelease' : 'latest';
  } else if (BRANCH === 'next') {
    return 'next';
  } else {
    return 'smoke';
  }
}

function getPackagesFromPreviousBuilds() {
  cp.execSync(`buildkite-agent artifact download "**/Detox*.tbz" / --build ${process.env.BUILDKITE_BUILD_ID}`).toString();
  cp.execSync(`mkdir -p detox/Detox-android`);
  cp.execSync(`buildkite-agent artifact download "**/com/**" / --build ${process.env.BUILDKITE_BUILD_ID}`).toString();
  cp.execSync(`find . -name "*.t[bg]z" -exec cp {} detox/ \\;`);
}

module.exports = {
  log,
  logSection,
  getVersionSafe,
  getReleaseNpmTag,
  getReleaseVersionType,
  getPackagesFromPreviousBuilds,
  isRelease,
  isDryRun,
  isSkipNpm
};
