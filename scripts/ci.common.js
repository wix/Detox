/* tslint:disable: no-console */
const semver = require('semver');
const fs = require('fs');
const chalk = require('chalk');

const _chalk = new chalk.constructor({level: 0, enabled: true});

const log = (...args) => console.log(_chalk.blue('[RELEASE]'), ...args);

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
  getVersionSafe,
};
