const fs = require('fs');
const path = require('path');

const resolveFrom = require('resolve-from');
const semver = require('semver');

const { log } = require('../../../../internals');
const detoxPackageJson = require('../../../../package.json');
const { DetoxRuntimeError } = require('../../../../src/errors');

function assertJestCircus27(maybeProjectConfig) {
  const projectConfig = maybeProjectConfig.projectConfig || maybeProjectConfig;

  if (!/jest-circus/.test(projectConfig.testRunner)) {
    throw new DetoxRuntimeError({
      message: 'Cannot continue without Jest Circus test runner underneath, exiting.',
      hint: 'Make sure that in your Jest config you have no "testRunner" property or it is explicitly set to "jest-circus/runner".',
      debugInfo: `The test runner powering your configuration is:\n${projectConfig.testRunner}`,
    });
  }

  const circusPackageJson = path.join(path.dirname(projectConfig.testRunner), 'package.json');
  if (!fs.existsSync(circusPackageJson)) {
    throw new DetoxRuntimeError({
      message: 'Check that you have an installed copy of "jest-circus" npm package, exiting.',
      debugInfo: `Its package.json file is missing: ${circusPackageJson}`,
    });
  }

  const jestManifestPath = resolveFrom(process.cwd(), 'jest/package.json');
  const jestManifest = require(jestManifestPath);
  assertSupportedVersion(jestManifest.version);

  const circusVersion = require(circusPackageJson).version;
  if (!circusVersion) {
    throw new DetoxRuntimeError({
      message: 'Check that you have an valid copy of "jest-circus" npm package, exiting.',
      debugInfo: `Its package.json file has no "version" property. See:\n` + circusPackageJson,
    });
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
    throw new DetoxRuntimeError({
      message: `Detected an unsupported jest@${actualVersion} version.`,
      hint: `Please ${action} your Jest test runner to the supported range: ${supportedRange}.`
    });
  }
}

module.exports = {
  assertJestCircus27,
  assertSupportedVersion,
};
