const WholeTestRecorderPlugin = require('./WholeTestRecorderPlugin');

/***
 * @abstract
 */
class StartupAndTestRecorderPlugin extends WholeTestRecorderPlugin {
  constructor({ api }) {
    super({ api });

    this.startupRecording = null;
    this._isRecordingStartup = false;
    this._hasFailingTests = false;
  }

  /***
   * @protected
   */
  get currentRecording() {
    return this._isRecordingStartup
      ? this.startupRecording
      : this.testRecording;
  }

  async onBeforeAll() {
    if (this.enabled) {
      const recording = this.createStartupRecording();
      await recording.start();

      this.startupRecording = recording;
      this.api.trackArtifact(recording);
      this._isRecordingStartup = true;
    }

    await super.onBeforeAll();
  }

  async onBeforeEach(testSummary) {
    if (this._isRecordingStartup) {
      await this.startupRecording.stop();
      this._isRecordingStartup = false;
    }

    await super.onBeforeEach(testSummary);
  }

  async onAfterEach(testSummary) {
    if (testSummary.status === 'failed') {
      this._hasFailingTests = true;
    }

    await super.onAfterEach(testSummary);

    if (this.startupRecording) {
      this._tryToFinalizeStartupRecording(false);
    }
  }

  async onAfterAll() {
    if (this.startupRecording) {
      this._finalizeStartupRecording();
    }

    await super.onAfterAll();
  }

  /***
   * @abstract
   * @protected
   */
  createStartupRecording() {}

  /***
   * @abstract
   * @protected
   */
  async preparePathForStartupArtifact() {}

  _shouldKeepStartupRecording() {
    if (this.keepOnlyFailedTestsArtifacts && !this._hasFailingTests) {
      return false;
    }

    return true;
  }

  _tryToFinalizeStartupRecording(isExiting) {
    if (this._shouldKeepStartupRecording()) {
      this._startSavingStartupRecording(this.startupRecording);
      this.startupRecording = null;
    } else if (isExiting) {
      this._startDiscardingStartupRecording(this.startupRecording);
      this.startupRecording = null;
    }
  }

  _finalizeStartupRecording() {
    this._tryToFinalizeStartupRecording(true);
  }

  _startSavingStartupRecording(startupRecording) {
    this.api.requestIdleCallback(async () => {
      const artifactPath = await this.preparePathForStartupArtifact();
      await startupRecording.save(artifactPath);
      this.api.untrackArtifact(startupRecording);
    });
  }

  _startDiscardingStartupRecording(startupRecording) {
    this.api.requestIdleCallback(async () => {
      await startupRecording.discard();
      this.api.untrackArtifact(startupRecording);
    });
  }
}

module.exports = StartupAndTestRecorderPlugin;