const _ = require('lodash');
const fs = require('fs');
const path = require('path');

function getLatestArtifactsDir() {
  if (!fs.existsSync('artifacts')) {
    return null;
  }

  const sessionDirNames = fs.readdirSync('artifacts');
  const sessionDirs = sessionDirNames.map(name => path.join('artifacts', name));
  const stats = _.zipObject(sessionDirs, sessionDirs.map(dir => fs.statSync(dir)));

  return _(sessionDirs)
    .filter(dir => stats[dir].isDirectory())
    .maxBy((dir) => stats[dir].mtime);
}

function assertArtifactExists(name) {
  const artifactsRootDir = getLatestArtifactsDir();
  const artifactPath = path.join(artifactsRootDir, name);
  if (!fs.existsSync(artifactPath)) {
    throw new Error('Assertion failed.\nFailed to find an artifact at path: ' + artifactPath);
  }
}

async function waitUntilArtifactsManagerIsIdle() {
  if (typeof detox !== 'undefined') {
    await detox.__waitUntilArtifactsManagerIsIdle__();
  }
}

module.exports = {
  getLatestArtifactsDir,
  assertArtifactExists,
  waitUntilArtifactsManagerIsIdle,
};