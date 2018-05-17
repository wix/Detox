class ScreenshotterHooks {
  constructor({
    enabled,
    keepOnlyFailedTestScreenshots,
    screenshotter,
    pathStrategy,
  }) {
    this._enabled = enabled;
    this._keepOnlyFailedTestScreenshots = keepOnlyFailedTestScreenshots;
    this._screenshotter = screenshotter;
    this._pathStrategy = pathStrategy;
    this._finalizationTasks = [];
    this._screenshotHandles = [null, null];
  }

  async onStart() {}

  async onBeforeTest(testSummary) {
    this._resetScreenshotHandles();

    if (this._shouldTakeScreenshotBefore(testSummary)) {
      await this._takeScreenshot(testSummary, 0, 'before');
    }
  }

  async onAfterTest(testSummary) {
    if (this._shouldTakeScreenshotAfter(testSummary)) {
      await this._takeScreenshot(testSummary, 1, 'after');
    }

    if (this._shouldKeepScreenshots(testSummary)) {
      this._startSavingScreenshot(0);
      this._startSavingScreenshot(1);
    } else {
      this._startDiscardingScreenshot(0);
      this._startDiscardingScreenshot(1);
    }
  }

  async onExit() {
    this._resetScreenshotHandles();
    await Promise.all(this._finalizationTasks);
  }

  async _takeScreenshot(testSummary, index, title) {
    const pathToScreenshot = this._pathStrategy.constructPathForTestArtifact(testSummary, title);
    const handle = await this._screenshotter.takeScreenshot(pathToScreenshot);

    this._screenshotHandles[index] = handle;
  }

  _startSavingScreenshot(index) {
    const handle = this._screenshotHandles[index];

    if (handle) {
      this._finalizationTasks.push(handle.save());
    }
  }

  _startDiscardingScreenshot(index) {
    const handle = this._screenshotHandles[index];

    if (handle) {
      this._finalizationTasks.push(handle.discard());
    }
  }

  _resetScreenshotHandles() {
    this._screenshotHandles[0] = null;
    this._screenshotHandles[1] = null;
  }

  _shouldTakeScreenshots(/* testSummary */) {
    return this._enabled;
  }

  _shouldTakeScreenshotBefore(testSummary) {
    return this._shouldTakeScreenshots(testSummary);
  }

  _shouldTakeScreenshotAfter(testSummary) {
    return this._shouldKeepScreenshots(testSummary);
  }

  _shouldKeepScreenshots(testSummary) {
    if (!this._enabled) {
      return false;
    }

    const testStatus = testSummary.status;

    if (this._keepOnlyFailedTestScreenshots && testStatus !== 'failed') {
      return false;
    }

    return true;
  }
}

module.exports = ScreenshotterHooks;
