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

  async onBeforeTest(testSummary) {
    await this._takeSnapshot(testSummary, 0, 'before');
  }

  async onAfterTest(testSummary) {
    if (this._shouldKeepSnapshots(testSummary)) {
      await this._takeSnapshot(testSummary, 1, 'after');
      this._startSavingSnapshot(0);
      this._startSavingSnapshot(1);
    } else {
      this._startDiscardingSnapshot(0);
    }

    this._resetSnapshotHandles();
  }

  async onExit() {
    this._resetSnapshotHandles();
    await Promise.all(this._finalizationTasks);
  }

  async _takeSnapshot(testSummary, index, title) {
    const pathToSnapshot = this._pathBuilder.buildPathForTestArtifact(testSummary, title);
    const snapshot =  await this._snapshotter.snapshot(pathToSnapshot);

    this._snapshots[index] = snapshot;
    await snapshot.create();
  }

  _startSavingSnapshot(index) {
    const handle = this._snapshots[index];
    this._finalizationTasks.push(handle.save());
  }

  _startDiscardingSnapshot(index) {
    const handle = this._snapshots[index];
    this._finalizationTasks.push(handle.discard());
  }

  _resetSnapshotHandles() {
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
