module.exports = ({ rootDir }) => {
  const path = require('path');
  const sanitize = require('sanitize-filename');

  return {
    buildPathForTestArtifact(artifactName, testSummary = null) {
      return path.join(rootDir, sanitize(artifactName));
    }
  };
};
