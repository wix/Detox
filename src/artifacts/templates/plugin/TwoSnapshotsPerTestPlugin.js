const ArtifactPlugin = require('./ArtifactPlugin');

/***
 * @abstract
 */
class TwoSnapshotsPerTestPlugin extends ArtifactPlugin {
  constructor({ api }) {
    super({ api });
    this.snapshots = {};
  }

  async onBeforeEach(testSummary) {
    await super.onBeforeEach(testSummary);
    await this._takeAutomaticSnapshot('beforeEach');
  }

  async onAfterEach(testSummary) {
    await super.onAfterEach(testSummary);

    if (this.shouldKeepArtifactOfTest(testSummary)) {
      await this._takeAutomaticSnapshot('afterEach');
      this.startSavingSnapshot('beforeEach');
      this.startSavingSnapshot('afterEach');
    } else {
      this.startDiscardingSnapshot('beforeEach');
    }

    this._clearAutomaticSnapshotReferences();
  }

  /***
   * @protected
   * @abstract
   */
  async preparePathForSnapshot(testSummary, snapshotName) {}


  /***
   * Creates a handle for a test artifact (video recording, log, etc.)
   *
   * @abstract
   * @protected
   * @return {Artifact} - an object with synchronous .discard() and .save(path) methods
   */
  createTestArtifact() {}

  _clearAutomaticSnapshotReferences() {
    delete this.snapshots.beforeEach;
    delete this.snapshots.afterEach;
  }

  async _takeAutomaticSnapshot(name) {
    if (this.enabled) {
      await this.takeSnapshot(name);
    }
  }

  /***
   * @protected
   */
  async takeSnapshot(name) {
    const snapshot = this.snapshots[name] = this.createTestArtifact();
    await snapshot.start();
    await snapshot.stop();

    this.api.trackArtifact(snapshot);
  }

  /***
   * @protected
   */
  startSavingSnapshot(name) {
    const snapshot = this.snapshots[name];
    if (!snapshot) {
      return;
    }

    const {testSummary} = this.context;
    this.api.requestIdleCallback(async () => {
      const snapshotArtifactPath = await this.preparePathForSnapshot(testSummary, name);
      await snapshot.save(snapshotArtifactPath);
      this.api.untrackArtifact(snapshot);
    });
  }

  /***
   * @protected
   */
  startDiscardingSnapshot(name) {
    const snapshot = this.snapshots[name];
    if (!snapshot) {
      return;
    }

    this.api.requestIdleCallback(async () => {
      await snapshot.discard();
      this.api.untrackArtifact(snapshot);
    });
  }
}

module.exports = TwoSnapshotsPerTestPlugin;
