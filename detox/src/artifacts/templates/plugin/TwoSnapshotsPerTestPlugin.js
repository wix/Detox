/* eslint @typescript-eslint/no-unused-vars: ["error", { "args": "none" }] */
// @ts-nocheck
const DetoxRuntimeError = require('../../../errors/DetoxRuntimeError');

const ArtifactPlugin = require('./ArtifactPlugin');

/***
 * @abstract
 */
class TwoSnapshotsPerTestPlugin extends ArtifactPlugin {
  constructor({ api }) {
    super({ api });

    this.shouldTakeAutomaticSnapshots = this.api.userConfig.shouldTakeAutomaticSnapshots;
    this.keepOnlyFailedTestsArtifacts = this.api.userConfig.keepOnlyFailedTestsArtifacts;

    this.takeAutomaticSnapshots = this.api.userConfig.takeWhen
      ? {
        testStart: false,
        testFailure: true,
        testDone: false,
        ...this.api.userConfig.takeWhen
      }
      : {
        testStart: true,
        testFailure: true,
        testDone: true,
      };

    this.snapshots = {
      fromTest: {},
      fromSession: {},
    };
  }

  async onTestStart(testSummary) {
    this.context.testSummary = null;
    this._flushSessionSnapshots();

    await super.onTestStart(testSummary);
    await this._takeAutomaticSnapshot('testStart');
  }

  async onHookFailure(event) {
    await super.onHookFailure(event);

    const shouldTake = this.takeAutomaticSnapshots.testFailure;
    await this._takeAutomaticSnapshot(`${event.hook}Failure`, shouldTake);
  }

  async onTestFnFailure(event) {
    await super.onTestFnFailure(event);

    const shouldTake = this.takeAutomaticSnapshots.testFailure;
    await this._takeAutomaticSnapshot('testFnFailure', shouldTake);
  }

  async onTestDone(testSummary) {
    await super.onTestDone(testSummary);

    if (this.shouldKeepArtifactOfTest(testSummary)) {
      await this._takeAutomaticSnapshot('testDone');
      this._startSavingSnapshots('fromTest');
    } else {
      this._startDiscardingSnapshots('fromTest');
    }

    this.context.testSummary = null;
    this._flushSessionSnapshots();
  }

  async onBeforeCleanup() {
    await super.onBeforeCleanup();
    this._flushSessionSnapshots();
  }

  async onCreateExternalArtifact(e) {
    if (!e.artifact) {
      throw new DetoxRuntimeError('Internal error: expected Artifact instance in the event');
    }

    this._registerSnapshot(e.name, e.artifact);
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

  async _takeAutomaticSnapshot(name, force) {
    if (this.enabled && this.shouldTakeAutomaticSnapshots) {
      if (this.takeAutomaticSnapshots[name] || force) {
        await this._takeSnapshot(name);
      }
    }
  }

  async _takeSnapshot(name) {
    const snapshot = this.createTestArtifact();
    await snapshot.start();
    await snapshot.stop();

    this._registerSnapshot(name, snapshot);
  }

  _registerSnapshot(name, snapshot) {
    const snapshots = this.context.testSummary
      ? this.snapshots.fromTest
      : this.snapshots.fromSession;

    snapshots[name] = snapshot;
    this.api.trackArtifact(snapshot);
  }

  _startSavingSnapshots(where) {
    const { testSummary } = this.context;
    const snapshots = this.snapshots[where];

    for (const [name, snapshot] of Object.entries(snapshots)) {
      delete this.snapshots[name];

      this.api.requestIdleCallback(async () => {
        const snapshotArtifactPath = await this.preparePathForSnapshot(testSummary, name);
        await snapshot.save(snapshotArtifactPath);
        this.api.untrackArtifact(snapshot);
      });
    }
  }

  _startDiscardingSnapshots(where) {
    const snapshots = this.snapshots[where];

    for (const [name, snapshot] of Object.entries(snapshots)) {
      delete this.snapshots[name];

      this.api.requestIdleCallback(async () => {
        await snapshot.discard();
        this.api.untrackArtifact(snapshot);
      });
    }
  }

  _flushSessionSnapshots() {
    if (this.shouldKeepArtifactOfSession() === true) {
      this._startSavingSnapshots('fromSession');
    }

    if (this.shouldKeepArtifactOfSession() === false) {
      this._startDiscardingSnapshots('fromSession');
    }
  }
}

module.exports = TwoSnapshotsPerTestPlugin;
