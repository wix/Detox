const path = require('path');
const sanitizeFilename = require('sanitize-filename');

const SANITIZE_OPTIONS = {replacement: '_'};
const sanitize = (filename) => sanitizeFilename(filename, SANITIZE_OPTIONS);

class CustomPathBuilder {
  constructor({ platform, rootDir }) {
    this.platform = platform;
    this.rootDir = rootDir;
  }

  buildPathForTestArtifact(artifactName, testSummary = null) {
    const fullName = testSummary && testSummary.fullName || '';
    const segments = [this.rootDir, this.platform, sanitize(fullName), sanitize(artifactName)];

    return path.join(...segments.filter(Boolean));
  }
}

module.exports = CustomPathBuilder;
