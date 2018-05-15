const path = require('path');
const trimFilename = require('../../../utils/trimFilename');

class NoConflictPathStrategy {
  constructor({ artifactsRootDir }) {
    this._nextIndex = 0;
    this._testIndices = new WeakMap();
    this._artifactsRootDir = artifactsRootDir;
    this._currentTestRunDir = `detox_artifacts.${new Date().toISOString()}`;
  }

  constructPathForTestArtifact(testSummary, artifactName) {
    const testIndexPrefix = this._getTestIndex(testSummary) + '. ';
    const testArtifactsDirname = trimFilename(testIndexPrefix, testSummary.fullName);
    const artifactFilename = trimFilename('', artifactName);

    const artifactPath = path.join(
      this._artifactsRootDir,
      this._currentTestRunDir,
      testArtifactsDirname,
      artifactFilename
    );

    this._assertConstructedPathIsStillInsideArtifactsRootDir(artifactPath)
    return artifactPath;
  }

  _assertConstructedPathIsStillInsideArtifactsRootDir(artifactPath, testSummary) {
    const pathRelativeToArtifactsRootDir = path.relative(this._artifactsRootDir, artifactPath);

    if (NoConflictPathStrategy.IS_OUTSIDE.test(pathRelativeToArtifactsRootDir)) {
      throw new DetoxRuntimeError({
        message: `Given artifact location (${pathRelativeToArtifactsRootDir}) was resolved outside of artifacts root directory (${this._artifactsRootDir})`,
        hint: `Make sure that test name (${JSON.stringify(testSummary.fullName)}) does not contain ".." fragments inside.`,
      });
    }
  }

  _getTestIndex(testSummary) {
    if (!this._testIndices.has(testSummary)) {
      this._testIndices.set(testSummary, this._nextIndex);
      return this._nextIndex++;
    }

    return this._testIndices.get(testSummary);
  }
}

NoConflictPathStrategy.IS_OUTSIDE = /^\.\.[/\\]/g;

module.exports = NoConflictPathStrategy;
