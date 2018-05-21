class SnapshotterLifecycle {
  constructor({
    keepOnlyFailedTestsSnapshots,
    pathBuilder,
    snapshotter,
    enqueueFinalizationTask,
  }) {
    this._keepOnlyFailedTestsSnapshots = keepOnlyFailedTestsSnapshots;
    this._pathBuilder = pathBuilder;
    this._snapshotter = snapshotter;
    this._enqueueFinalizationTask = enqueueFinalizationTask;
    this._snapshots = [null, null];
  }

  async onStart() {}

  async onBeforeTest() {
    await this._takeSnapshot(0);
  }

  async onAfterTest(testSummary) {
    if (this._shouldKeepSnapshots(testSummary)) {
      await this._takeSnapshot(1);

      this._startSavingSnapshot(testSummary, 0, 'before');
      this._startSavingSnapshot(testSummary, 1, 'after');
    } else {
      this._startDiscardingSnapshot(0);
    }

    this._clearSnapshotReferences();
  }

  async onExit() {}

  async _takeSnapshot(index) {
    const snapshot =  await this._snapshotter.snapshot();

    this._snapshots[index] = snapshot;
    await snapshot.create();
  }

  _startSavingSnapshot(testSummary, index, title) {
    const snapshotArtifactPath = this._pathBuilder.buildPathForTestArtifact(testSummary, title);
    const snapshot = this._snapshots[index];

    this._enqueueFinalizationTask(() => snapshot.save(snapshotArtifactPath));
  }

  _startDiscardingSnapshot(index) {
    const snapshot = this._snapshots[index];

    this._enqueueFinalizationTask(() => snapshot.discard());
  }

  _clearSnapshotReferences() {
    this._snapshots[0] = null;
    this._snapshots[1] = null;
  }

  _shouldKeepSnapshots(testSummary) {
    const testStatus = testSummary.status;

    if (this._keepOnlyFailedTestsSnapshots && testStatus !== 'failed') {
      return false;
    }

    return true;
  }
}

module.exports = SnapshotterLifecycle;
