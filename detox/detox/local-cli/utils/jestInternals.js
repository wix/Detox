// @ts-nocheck
const Module = require('module');
const path = require('path');

const _ = require('lodash');
const resolveFrom = require('resolve-from');
const semver = require('semver');

const { DetoxRuntimeError } = require('../../src/errors');

const { extractKnownKeys } = require('./yargsUtils');

const getNodeModulePaths = (dir) => Module._nodeModulePaths(dir);

function getJestLocation() {
  const cwd = process.cwd();

  if (!resolveFrom.silent(cwd, 'jest')) {
    throw new DetoxRuntimeError({
      message: 'Could not resolve "jest" package from the current working directory.\n\n' +
        'This means that Detox could not find it in any of the following locations:\n' +
        getNodeModulePaths(cwd).map(p => `* ${p}`).join('\n'),
      hint: `Try installing "jest": npm install jest --save-dev`,
    });
  }

  return path.dirname(resolveFrom(cwd, 'jest/package.json'));
}

function resolveJestDependency(jestLocation, dependencyName) {
  const result = resolveFrom.silent(jestLocation, dependencyName);
  if (!result) {
    throw new DetoxRuntimeError({
      message: `Could not resolve "${dependencyName}" package from the "jest" npm package directory.\n\n` +
        'This means that Detox could not find it in any of the following locations:\n' +
        getNodeModulePaths(jestLocation).map(p => `* ${p}`).join('\n'),
      hint: 'Consider reporting this as an issue at: https://github.com/wix/Detox/issues'
    });
  }

  return result;
}

function requireJestDependency(jestLocation, dependencyName) {
  return require(resolveJestDependency(jestLocation, dependencyName));
}

function resolveJestCliArgs() {
  const jestLocation = getJestLocation();
  resolveJestDependency(jestLocation, 'jest-cli');

  try {
    const jestCliManifest = resolveJestDependency(jestLocation, 'jest-cli/package.json');
    const jestCliVersion = require(jestCliManifest).version;
    const argsJsFilePath = semver.gt(jestCliVersion, '29.1.2') ? 'build/args.js' : 'build/cli/args.js';
    const argsJsFile = path.join(path.dirname(jestCliManifest), argsJsFilePath);

    return require(argsJsFile);
  } catch (e) {
    throw new DetoxRuntimeError({
      message: 'Could not parse CLI arguments supported by "jest-cli" package, see the error below.',
      hint: 'Consider reporting this as an issue at: https://github.com/wix/Detox/issues',
      debugInfo: e,
    });
  }
}

async function readJestConfig(argv) {
  const jestLocation = getJestLocation();
  const { readConfig } = requireJestDependency(jestLocation, 'jest-config');
  return readConfig(argv, process.cwd(), false);
}

function getJestBooleanArgs() {
  return _(resolveJestCliArgs())
    .thru(args => args.options)
    .pickBy(({ type }) => type === 'boolean')
    .thru(extractKnownKeys)
    .value();
}

module.exports = {
  getJestBooleanArgs,
  readJestConfig,
};
