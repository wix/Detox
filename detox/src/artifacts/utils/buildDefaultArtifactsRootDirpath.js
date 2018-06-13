const path = require('path');
const argparse = require('../../utils/argparse');

function getUniqueSubdirectory() {
  const configuration = argparse.getArgValue('configuration') || 'detox_artifacts';
  const timestamp = new Date().toISOString()
    .replace(/T/, ' ')
    .replace(/\.\d{3}/, '');

  return `${configuration}.${timestamp}`;
}

function buildDefaultArtifactsRootDirpath(rootDirName = 'artifacts') {
  if (rootDirName.endsWith('/') || rootDirName.endsWith('\\')) {
    return rootDirName;
  }

  return path.join(rootDirName, getUniqueSubdirectory());
}

module.exports = buildDefaultArtifactsRootDirpath;
