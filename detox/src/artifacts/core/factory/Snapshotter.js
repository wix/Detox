class Snapshotter {
  constructor({ artifactsRegistry }) {
    this.artifactsRegistry = artifactsRegistry;
  }

  snapshot() {
    const snapshot = this.createSnapshot();

    this.artifactsRegistry._registerArtifact(snapshot);
    return snapshot;
  }

  createSnapshot() { /* abstract */ }
}

module.exports = Snapshotter;
