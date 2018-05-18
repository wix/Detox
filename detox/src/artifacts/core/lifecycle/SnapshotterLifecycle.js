class SnapshotterLifecycle {
  constructor({
    keepOnlyFailedTestsSnapshots,
    pathBuilder,
    snapshotter,
  }) {
    this._keepOnlyFailedTestsSnapshots = keepOnlyFailedTestsSnapshots;
    this._pathBuilder = pathBuilder;
    this._snapshotter = snapshotter;
    this._finalizationTasks = [];
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

  async onExit() {
    await Promise.all(this._finalizationTasks);
  }

  async _takeSnapshot(index) {
    const snapshot =  await this._snapshotter.snapshot();

    this._snapshots[index] = snapshot;
    await snapshot.create();
  }

  _startSavingSnapshot(testSummary, index, title) {
    const snapshotArtifactPath = this._pathBuilder.buildPathForTestArtifact(testSummary, title);
    const snapshot = this._snapshots[index];
    const savingTask = snapshot.save(snapshotArtifactPath);
    this._finalizationTasks.push(savingTask);
  }

  _startDiscardingSnapshot(index) {
    const snapshot = this._snapshots[index];
    const discardingTask = snapshot.discard();
    this._finalizationTasks.push(discardingTask);
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
