class RecorderLifecycle {
  constructor({
    shouldRecordStartup,
    keepOnlyFailedTestsRecordings,
    recorder,
    pathBuilder,
    registerRecording,
  }) {
    this._shouldRecordStartup = shouldRecordStartup;
    this._keepOnlyFailedTestsRecordings = keepOnlyFailedTestsRecordings;
    this._recorder = recorder;
    this._pathBuilder = pathBuilder;
    this._registerRecording = registerRecording;

    this._startupRecording = null;
    this._testRecording = null;

    this._isRunningFirstTest = true;
    this._hasFailingTests = false;
    this._finalizationTasks = [];
  }

  async onStart() {
    if (this._shouldRecordStartup) {
      const startupRecordingPath = this._pathBuilder.buildPathForRunArtifact('startup');

      const recording = this._startupRecording = this._recorder.record(startupRecordingPath);
      this._registerRecording(recording);

      await recording.start();
    }
  }

  async onBeforeTest(testSummary) {
    if (this._isRunningFirstTest) {
      this._isRunningFirstTest = false;
      await this._startupRecording.stop();
    }

    const testRecordingPath = this._pathBuilder.buildPathForTestArtifact(testSummary, 'test');

    this._testRecording = this._recorder.record(testRecordingPath);
    await this._testRecording.start();
  }

  async onAfterTest(testSummary) {
    this._checkIfTestFailed(testSummary);

    const recording = this._testRecording;
    if (recording == null)  {
      return;
    }

    await recording.stop();

    const finalizationTask = this._shouldKeepTestRecording(testSummary)
      ? recording.save()
      : recording.discard();

    this._enqueue(finalizationTask);
    this._testRecording = null;
  }

  async onExit() {
    const startupRecording = this._startupRecording;

    if (startupRecording !== null) {
      const finalizationTask = this._shouldKeepStartupRecording()
        ? startupRecording.save()
        : startupRecording.discard();

      this._enqueue(finalizationTask);
    }

    await Promise.all(this._finalizationTasks);
  }

  _shouldKeepStartupRecording() {
    if (this._keepOnlyFailedTestsRecordings && !this._hasFailingTests) {
      return false;
    }

    return true;
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

  _enqueue(finalizationTaskPromise) {
    this._finalizationTasks.push(finalizationTaskPromise);
  }
}

module.exports = RecorderLifecycle;