const path = require('path');

const getTimeStampString = require('./getTimeStampString');

function buildDefaultRootForArtifactsRootDirpath(configuration, rootDir) {
  if (rootDir.endsWith('/') || rootDir.endsWith('\\')) {
    return rootDir.slice(0, -1);
  }

  return path.join(rootDir, `${configuration}.${getTimeStampString(new Date())}`);
}

module.exports = buildDefaultRootForArtifactsRootDirpath;
