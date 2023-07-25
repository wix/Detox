const fs = require('fs');
const path = require('path');

const resolveFrom = require('resolve-from');
const semver = require('semver');

const { log } = require('detox/internals');
const detoxPackageJson = require('detox/package.json');

function assertJestCircus27(maybeProjectConfig) {
  const projectConfig = maybeProjectConfig.projectConfig || maybeProjectConfig;

  if (!/jest-circus/.test(projectConfig.testRunner)) {
    throw new Error('Cannot continue without Jest Circus test runner underneath, exiting.');
  }

  const circusPackageJson = path.join(path.dirname(projectConfig.testRunner), 'package.json');
  if (!fs.existsSync(circusPackageJson)) {
    throw new Error('Check that you have an installed copy of "jest-circus" npm package, exiting.');
  }

  const jestManifestPath = resolveFrom(process.cwd(), 'jest/package.json');
  const jestManifest = require(jestManifestPath);
  assertSupportedVersion(jestManifest.version);

  const circusVersion = require(circusPackageJson).version;
  if (!circusVersion) {
    throw new Error('Check that you have an valid copy of "jest-circus" npm package, exiting.');
  }

  if (jestManifest.version !== circusVersion) {
    log.warn([
      `jest-circus@${circusVersion} does not match jest@${jestManifest.version}.\n`,
      `- jest@${jestManifest.version} resolved path:\n\t${jestManifestPath}`,
      `- jest-circus@${circusVersion} resolved path:\n\t${circusPackageJson}`,
      `\nPlease make sure that your versions match to avoid unexpected behavior!`,
    ].join('\n'));
  }

  return maybeProjectConfig;
}

function assertSupportedVersion(actualVersion) {
  const supportedRange = detoxPackageJson.peerDependencies.jest;
  const minSupportedVersion = semver.minVersion(supportedRange);
  const action = semver.lt(actualVersion, minSupportedVersion) ? 'upgrade' : 'downgrade';

  if (!semver.satisfies(actualVersion, supportedRange, { includePrerelease: true })) {
    throw new Error(`Detected an unsupported jest@${actualVersion} version.`);
  }
}

module.exports = {
  assertJestCircus27,
  assertSupportedVersion,
};
