class RecorderLifecycle {
  constructor({
    shouldRecordStartup,
    keepOnlyFailedTestsRecordings,
    recorder,
    pathBuilder,
    enqueueFinalizationTask,
  }) {
    this._shouldRecordStartup = shouldRecordStartup;
    this._keepOnlyFailedTestsRecordings = keepOnlyFailedTestsRecordings;
    this._recorder = recorder;
    this._pathBuilder = pathBuilder;
    this._enqueueFinalizationTask = enqueueFinalizationTask;

    this._startupRecording = null;
    this._testRecording = null;

    this._isRecordingStartup = false;
    this._hasFailingTests = false;
  }

  async onStart() {
    if (this._shouldRecordStartup) {
      await this._beginRecordingStartup();
    }
  }

  async onBeforeTest() {
    if (this._isRecordingStartup) {
      await this._stopRecordingStartup();
    }

    this._testRecording = this._recorder.record();
    await this._testRecording.start();
  }

  async onAfterTest(testSummary) {
    await this._testRecording.stop();

    this._checkIfTestFailed(testSummary);
    this._finalizeTestRecording(testSummary);
  }

  async onExit() {
    if (this._startupRecording !== null) {
      this._finalizeStartupRecording();
    }
  }

  async _beginRecordingStartup() {
    this._startupRecording = this._recorder.record();
    await this._startupRecording.start();
    this._isRecordingStartup = true;
  }

  async _stopRecordingStartup() {
    await this._startupRecording.stop();
    this._isRecordingStartup = false;

    if (this._shouldKeepStartupRecording()) {
      this._startSavingStartupRecording();
    }
  }

  _finalizeStartupRecording() {
    if (this._shouldKeepStartupRecording()) {
      this._startSavingStartupRecording();
    } else {
      this._startDiscardingStartupRecording();
    }
  }

  _shouldKeepStartupRecording() {
    if (this._keepOnlyFailedTestsRecordings && !this._hasFailingTests) {
      return false;
    }

    return true;
  }

  _startSavingStartupRecording() {
    const startupRecording = this._startupRecording;
    const startupRecordingPath = this._pathBuilder.buildPathForRunArtifact('startup');
    this._enqueueFinalizationTask(() => startupRecording.save(startupRecordingPath));
    this._startupRecording = null;
  }

  _startDiscardingStartupRecording() {
    const startupRecording = this._startupRecording;
    this._enqueueFinalizationTask(() => startupRecording.discard());
    this._startupRecording = null;
  }

  _shouldKeepTestRecording(testSummary) {
    const testStatus = testSummary.status;

    if (this._keepOnlyFailedTestsRecordings && testStatus !== 'failed') {
      return false;
    }

    return true;
  }

  _checkIfTestFailed(testSummary) {
    const testStatus = testSummary.status;

    if (testStatus === 'failed') {
      this._hasFailingTests = true;
    }
  }

  _finalizeTestRecording(testSummary) {
    if (this._shouldKeepTestRecording(testSummary)) {
      this._startSavingTestRecording(testSummary)
    } else {
      this._startDiscardingTestRecording();
    }
  }

  _startSavingTestRecording(testSummary) {
    const testRecording = this._testRecording;
    const recordingArtifactPath = this._pathBuilder.buildPathForTestArtifact(testSummary, 'test');
    this._enqueueFinalizationTask(() => testRecording.save(recordingArtifactPath));
    this._testRecording = null;
  }

  _startDiscardingTestRecording() {
    const testRecording = this._testRecording;
    this._enqueueFinalizationTask(() => testRecording.discard());
    this._testRecording = null;
  }
}

module.exports = RecorderLifecycle;