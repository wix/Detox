class FakePathBuilder {
  buildPathForTestArtifact(artifactName, testSummary) {
    return (testSummary ? (testSummary.fullName + '/') : '') + artifactName;
  }
}

module.exports = FakePathBuilder;