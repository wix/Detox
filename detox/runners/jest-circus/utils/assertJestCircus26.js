const fs = require('fs');
const path = require('path');

function assertJestCircus26(config) {
  if (!/jest-circus/.test(config.testRunner)) {
    throw new Error('Cannot run tests without "jest-circus" npm package, exiting.');
  }

  const circusPackageJson = path.join(path.dirname(config.testRunner), 'package.json');
  if (!fs.existsSync(circusPackageJson)) {
    throw new Error('Check that you have an installed copy of "jest-circus" npm package, exiting.');
  }

  const circusVersion = require(circusPackageJson).version || '';
  const [major] = circusVersion.split('.');
  if (major < 26) {
    throw new Error(
      `Cannot use older versions of "jest-circus", exiting.\n` +
      `You have jest-circus@${circusVersion}. Update to ^26.0.0 or newer.`
    );
  }

  return config;
}

module.exports = assertJestCircus26;
