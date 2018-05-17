const path = require('path');
const DetoxRuntimeError = require('../../errors/DetoxRuntimeError');
const constructSafeFilename = require('../../utils/constructSafeFilename');

class NoConflictPathStrategy {
  constructor({
    artifactsRootDir,
    getUniqueSubdirectory = NoConflictPathStrategy.generateTimestampBasedSubdirectoryName
  }) {
    this._nextIndex = -1;
    this._lastTestTitle = undefined;
    this._currentTestRunDir = path.join(artifactsRootDir, getUniqueSubdirectory());
  }

  get rootDir() {
    return this._currentTestRunDir;
  }

  constructPathForTestArtifact(testSummary, artifactName) {
    const testIndexPrefix = this._getTestIndex(testSummary) + '. ';
    const testArtifactsDirname = constructSafeFilename(testIndexPrefix, testSummary.fullName);
    const artifactFilename = constructSafeFilename(artifactName);

    const artifactPath = path.join(
      this._currentTestRunDir,
      testArtifactsDirname,
      artifactFilename
    );

    this._assertConstructedPathIsStillInsideArtifactsRootDir(artifactPath, testSummary);
    return artifactPath;
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

  _getTestIndex(testSummary) {
    if (this._lastTestTitle !== testSummary.fullName) {
      this._nextIndex++;
      this._lastTestTitle = testSummary.fullName;
    }

    return this._nextIndex;
  }
}

NoConflictPathStrategy.generateTimestampBasedSubdirectoryName = () => `detox_artifacts.${new Date().toISOString()}`;

module.exports = NoConflictPathStrategy;
