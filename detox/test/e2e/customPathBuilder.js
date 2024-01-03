module.exports = ({ rootDir }) => {
  const path = require('path');
  const sanitize = require('sanitize-filename');

  return {
    buildPathForTestArtifact(artifactName, _testSummary) {
      return path.join(rootDir, sanitize(artifactName));
    }
  };
};
