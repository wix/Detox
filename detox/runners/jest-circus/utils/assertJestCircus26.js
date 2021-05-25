const fs = require('fs');
const path = require('path');

const DetoxRuntimeError = require('../../../src/errors/DetoxRuntimeError');

function assertJestCircus26(config) {
  if (!/jest-circus/.test(config.testRunner)) {
    throw new DetoxRuntimeError('Cannot run tests without "jest-circus" npm package, exiting.');
  }

  const circusPackageJson = path.join(path.dirname(config.testRunner), 'package.json');
  if (!fs.existsSync(circusPackageJson)) {
    throw new DetoxRuntimeError('Check that you have an installed copy of "jest-circus" npm package, exiting.');
  }

  const circusVersion = require(circusPackageJson).version || '';
  const [major, minor, patch] = circusVersion.split('.');
  if (major < 26) {
    throw new DetoxRuntimeError(
      `Cannot use older versions of "jest-circus", exiting.\n` +
      `You have jest-circus@${circusVersion}. Update to ^26.0.0 or newer.`
    );
  }

  if (major == 26 && minor == 5 && patch < 2) {
    throw new DetoxRuntimeError(
      `You have jest-circus@${circusVersion} currently installed.\n` +
      `Unfortunately, it is incompatible with Detox due to this critical issue:\n\n` +
      `https://github.com/wix/Detox/issues/2390\n\n` +
      `Please update to jest-circus@^26.5.2 (or newer) to proceed.`
    );
  }

  return config;
}

module.exports = assertJestCircus26;
