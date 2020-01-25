const path = require('path');
const getTimeStampString = require('./getTimeStampString');

function buildDefaultRootForArtifactsRootDirpath(configuration, rootDir) {
  if (rootDir.endsWith('/') || rootDir.endsWith('\\')) {
    return rootDir;
  }

  const seed = Number(process.env.DETOX_START_TIMESTAMP || String(Date.now()));
  const subdir = `${configuration}.${getTimeStampString(new Date(seed))}`;
  return path.join(rootDir, subdir);
}

module.exports = buildDefaultRootForArtifactsRootDirpath;
