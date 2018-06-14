const ArtifactPlugin = require('./ArtifactPlugin');

/***
 * @abstract
 */
class TwoSnapshotsPerTestPlugin extends ArtifactPlugin {
  constructor({ api }) {
    super({ api });
    this._snapshots = [null, null];
  }

  async onBeforeEach() {
    await this._takeSnapshot(0);
  }

  async onAfterEach(testSummary) {
    if (this.shouldKeepArtifactOfTest(testSummary)) {
      await this._takeSnapshot(1);
      this._startSavingSnapshot(testSummary, 0);
      this._startSavingSnapshot(testSummary, 1);
    } else {
      this._startDiscardingSnapshot(0);
    }

    this._clearSnapshotReferences();
  }

  /***
   * @protected
   * @abstract
   */
  async preparePathForSnapshot(testSummary, index) {}

  async _takeSnapshot(index) {
    if (!this.enabled) {
      return;
    }

    const snapshot = this.createTestArtifact();
    await snapshot.start();
    await snapshot.stop();
    this._snapshots[index] = snapshot;
    this.api.trackArtifact(snapshot);
  }

  _startSavingSnapshot(testSummary, index) {
    const snapshot = this._snapshots[index];
    if (!snapshot) {
      return;
    }

    this.api.requestIdleCallback(async () => {
      const snapshotArtifactPath = await this.preparePathForSnapshot(testSummary, index);
      await snapshot.save(snapshotArtifactPath);
      this.api.untrackArtifact(snapshot);
    }, this);
  }

  _startDiscardingSnapshot(index) {
    const snapshot = this._snapshots[index];
    if (!snapshot) {
      return;
    }

    this.api.requestIdleCallback(async () => {
      await snapshot.discard();
      this.api.untrackArtifact(snapshot);
    }, this);
  }

  _clearSnapshotReferences() {
    this._snapshots[0] = null;
    this._snapshots[1] = null;
  }
}

module.exports = TwoSnapshotsPerTestPlugin;
