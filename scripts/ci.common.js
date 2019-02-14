/* tslint:disable: no-console */
const semver = require('semver');
const fs = require('fs');

const log = (...args) => console.log('[RELEASE]', ...args);

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

module.exports = {
  log,
  readPackageJson,
  getVersionSafe,
};
