const path = require('path');
const getTimeStampString = require('./getTimeStampString');

function buildDefaultRootForArtifactsRootDirpath(configuration, artifactsLocation) {
  if (artifactsLocation.endsWith('/') || artifactsLocation.endsWith('\\')) {
    return artifactsLocation;
  }

  const subdir = `${configuration}.${getTimeStampString()}`;
  return path.join(artifactsLocation, subdir);
}

module.exports = buildDefaultRootForArtifactsRootDirpath;
