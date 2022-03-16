// @ts-nocheck
const ArtifactPlugin = require('./ArtifactPlugin');

/***
 * @abstract
 */
class WholeTestRecorderPlugin extends ArtifactPlugin {
  constructor({ api }) {
    super({ api });

    this.testRecording = null;
  }

  async onTestStart(testSummary) {
    await super.onTestStart(testSummary);

    if (this.enabled) {
      this.testRecording = this.createTrackedTestRecording();
      await this.testRecording.start();
    }
  }

  async onTestDone(testSummary) {
    await super.onTestDone(testSummary);

    if (this.testRecording) {
      const testRecording = this.testRecording;
      await testRecording.stop();

      if (this.shouldKeepArtifactOfTest(testSummary)) {
        this._startSavingTestRecording(testRecording, testSummary);
      } else {
        this._startDiscardingTestRecording(testRecording);
      }

      this.testRecording = null;
    }
  }

  /***
   * @protected
   */
  createTrackedTestRecording(config) {
    const recording = this.createTestRecording(config);
    this.api.trackArtifact(recording);

    return recording;
  }

  /***
   * @abstract
   * @protected
   */
  createTestRecording() {}

  /***
   * @abstract
   */
  async preparePathForTestArtifact(testSummary) {} // eslint-disable-line no-unused-vars

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
