const ArtifactPlugin = require('./ArtifactPlugin');

/***
 * @abstract
 */
class WholeTestRecorderPlugin extends ArtifactPlugin {
  constructor({ api }) {
    super({ api });

    this.testRecording = null;
  }

  async onBeforeEach(testSummary) {
    await super.onBeforeEach(testSummary);

    if (this.enabled) {
      const recording = this.createTestArtifact(testSummary);
      await recording.start();

      this.api.trackArtifact(recording);
      this.testRecording = recording;
    }
  }

  async onAfterEach(testSummary) {
    await super.onAfterEach(testSummary);

    if (this.testRecording) {
      await this.testRecording.stop();

      if (this.shouldKeepArtifactOfTest(testSummary)) {
        this._startSavingTestRecording(this.testRecording, testSummary)
      } else {
        this._startDiscardingTestRecording(this.testRecording);
      }

      this.testRecording = null;
    }
  }

  createTestArtifact() {
    return this.createTestRecording();
  }

  /***
   * @abstract
   * @protected
   */
  createTestRecording() {}

  /***
   * @abstract
   */
  async preparePathForTestArtifact(testSummary) {}

  _startSavingTestRecording(testRecording, testSummary) {
    this.api.requestIdleCallback(async () => {
      const recordingArtifactPath = await this.preparePathForTestArtifact(testSummary);
      await testRecording.save(recordingArtifactPath);
      this.api.untrackArtifact(testRecording);
    }, this);
  }

  _startDiscardingTestRecording(testRecording) {
    this.api.requestIdleCallback(async () => {
      await testRecording.discard();
      this.api.untrackArtifact(testRecording);
    }, this);
  }
}

module.exports = WholeTestRecorderPlugin;