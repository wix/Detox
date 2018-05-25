const ArtifactPlugin = require('./ArtifactPlugin');

/***
 * @abstract
 */
class WholeTestRecorderPlugin extends ArtifactPlugin {
  constructor({ api }) {
    super({ api });

    this.testRecording = null;
  }

  async onBeforeTest(testSummary) {
    await super.onBeforeTest(testSummary);

    if (this.enabled) {
      const recording = this.createTestArtifact(testSummary);
      await recording.start();

      this.api.trackArtifact(recording);
      this.testRecording = recording;
    }
  }

  async onAfterTest(testSummary) {
    await super.onAfterTest(testSummary);

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
    });
  }

  _startDiscardingTestRecording(testRecording) {
    this.api.requestIdleCallback(async () => {
      await testRecording.discard();
      this.api.untrackArtifact(testRecording);
    });
  }
}

module.exports = WholeTestRecorderPlugin;