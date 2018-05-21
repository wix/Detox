const path = require('path');
const DetoxRuntimeError = require('../../../../errors/DetoxRuntimeError');
const constructSafeFilename = require('../../../../utils/constructSafeFilename');

class ArtifactPathBuilder {
  constructor({
    artifactsRootDir,
    getUniqueSubdirectory = ArtifactPathBuilder.generateTimestampBasedSubdirectoryName
  }) {
    this._currentTestRunDir = path.join(artifactsRootDir, getUniqueSubdirectory());
  }

  get rootDir() {
    return this._currentTestRunDir;
  }

  buildPathForRunArtifact(artifactName) {
    return path.join(
      this._currentTestRunDir,
      constructSafeFilename(artifactName),
    );
  }

  buildPathForTestArtifact(testSummary, artifactName) {
    const testArtifactPath = path.join(
      this._currentTestRunDir,
      this._constructDirectoryNameForCurrentRunningTest(testSummary),
      constructSafeFilename(artifactName),
    );

    this._assertConstructedPathIsStillInsideArtifactsRootDir(testArtifactPath, testSummary);
    return testArtifactPath;
  }

  _constructDirectoryNameForCurrentRunningTest(testSummary) {
    if (testSummary == null) {
      return '';
    }

    const testDirectoryPrefix = this._buildTestDirectoryPrefix(testSummary);
    const testArtifactsDirname = constructSafeFilename(testDirectoryPrefix, testSummary.fullName);

    return testArtifactsDirname;
  }

  _assertConstructedPathIsStillInsideArtifactsRootDir(artifactPath, testSummary) {
    const absoluteRootPath = path.resolve(this._currentTestRunDir);
    const absoluteArtifactPath = path.resolve(artifactPath);

    if (!absoluteArtifactPath.startsWith(absoluteRootPath)) {
      throw new DetoxRuntimeError({
        message: `Given artifact location (${path.resolve(artifactPath)}) was resolved outside of current test run directory (${this._currentTestRunDir})`,
        hint: `Make sure that test name (${JSON.stringify(testSummary.fullName)}) does not contain ".." fragments inside.`,
        debugInfo: `Resolved artifact location was: ${absoluteArtifactPath}`
      });
    }
  }

  _buildTestDirectoryPrefix(testSummary) {
    return this._getStatusSign(testSummary);
  }

  _getStatusSign(testSummary) {
    switch (testSummary.status) {
      case 'passed': return '✓ ';
      case 'failed': return '✗ ';
      default: return '';
    }
  }
}

ArtifactPathBuilder.generateTimestampBasedSubdirectoryName = () => `detox_artifacts.${new Date().toISOString()}`;

module.exports = ArtifactPathBuilder;
