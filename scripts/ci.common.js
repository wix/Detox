/* tslint:disable: no-console */
const semver = require('semver');
const fs = require('fs');
const chalk = require('chalk');

const log = (...args) => console.log('[RELEASE]', ...args);
const logSection = (message) => console.log(chalk.blue(`[RELEASE] ${message}`));

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

function releaseNpmTag() {
  if (process.env.RELEASE_NPM_TAG) {
    return process.env.RELEASE_NPM_TAG;
  } else if (process.env.BRANCH === 'master') {
    return 'latest';
  } else {
    return process.env.BRANCH;
  }
}

module.exports = {
  log,
  logSection,
  getVersionSafe,
  releaseNpmTag
};
