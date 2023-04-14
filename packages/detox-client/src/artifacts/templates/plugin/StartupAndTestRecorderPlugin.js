// @ts-nocheck
const WholeTestRecorderPlugin = require('./WholeTestRecorderPlugin');

/***
 * @abstract
 */
class StartupAndTestRecorderPlugin extends WholeTestRecorderPlugin {
  constructor({ api }) {
    super({ api });

    this.startupRecording = null;
    this._isInStartupPhase = true;
    this._isRecordingStartup = false;
  }

  /***
   * @protected
   */
  get currentRecording() {
    return this._isRecordingStartup
      ? this.startupRecording
      : this.testRecording;
  }

  /***
   * @protected
   */
  async onReadyToRecord() {
    if (this.enabled && this._isInStartupPhase && !this.startupRecording) {
      const recording = this.createStartupRecording();

      this.startupRecording = recording;
      this.api.trackArtifact(recording);
      this._isRecordingStartup = true;
    }
  }

  async onTestStart(testSummary) {
    this._isInStartupPhase = false;

    if (this._isRecordingStartup) {
      await this.startupRecording.stop();
      this._isRecordingStartup = false;
    }

    await super.onTestStart(testSummary);
  }

  async onTestDone(testSummary) {
    await super.onTestDone(testSummary);

    if (this.startupRecording) {
      this._tryToFinalizeStartupRecording();
    }
  }

  async onBeforeCleanup() {
    await super.onBeforeCleanup();

    if (this.startupRecording) {
      this._tryToFinalizeStartupRecording();
    }

    await super.onBeforeCleanup();
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

  _tryToFinalizeStartupRecording() {
    const shouldKeep = this.shouldKeepArtifactOfSession();

    if (shouldKeep === true) {
      this._startSavingStartupRecording(this.startupRecording);
      this.startupRecording = null;
    }

    if (shouldKeep === false) {
      this._startDiscardingStartupRecording(this.startupRecording);
      this.startupRecording = null;
    }
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
