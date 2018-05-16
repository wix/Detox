const path = require('path');
const DetoxRuntimeError = require('../../../errors/DetoxRuntimeError');
const trimFilename = require('../../../utils/trimFilename');

class NoConflictPathStrategy {
  constructor({ artifactsRootDir }) {
    this._nextIndex = 0;
    this._testIndices = new WeakMap();
    this._currentTestRunDir = path.join(artifactsRootDir, `detox_artifacts.${new Date().toISOString()}`);
  }

  get rootDir() {
    return this._currentTestRunDir;
  }

  constructPathForTestArtifact(testSummary, artifactName) {
    const testIndexPrefix = this._getTestIndex(testSummary) + '. ';
    const testArtifactsDirname = trimFilename(testIndexPrefix, testSummary.fullName);
    const artifactFilename = trimFilename('', artifactName);

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
    if (!this._testIndices.has(testSummary)) {
      this._testIndices.set(testSummary, this._nextIndex);
      return this._nextIndex++;
    }

    return this._testIndices.get(testSummary);
  }
}

NoConflictPathStrategy.IS_OUTSIDE = /^\.\.[/\\]/g;

module.exports = NoConflictPathStrategy;
