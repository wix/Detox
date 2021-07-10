const Module = require('module');
const path = require('path');

const resolveFrom = require('resolve-from');

const DetoxRuntimeError = require('../../src/errors/DetoxRuntimeError');

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
    const argsJsFile = path.join(path.dirname(jestCliManifest), 'build/cli/args.js');

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

module.exports = {
  resolveJestCliArgs,
  readJestConfig,
};
