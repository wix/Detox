class Snapshotter {
  constructor({ artifactsRegistry }) {
    this._artifactsRegistry = artifactsRegistry;
  }

  snapshot() {
    const snapshot = this.createSnapshot();

    this._artifactsRegistry.registerArtifact(snapshot);
    return snapshot;
  }

  createSnapshot() { /* abstract */ }
}

module.exports = Snapshotter;
