const _ = require('lodash');
const argparse = require('../utils/argparse');

const ArtifactPathBuilder =  require('./core/ArtifactPathBuilder');
const RecorderLifecycle = require('./core/RecorderLifecycle');
const SnapshotterLifecycle = require('./core/SnapshotterLifecycle');

class ArtifactsManager {
  constructor({ artifactCapabilities }) {
    this._hooks = [];
    this._recordings = [];
    this._registerRecording = this._registerRecording.bind(this);

    this._pathBuilder = new ArtifactPathBuilder({
      artifactsRootDir: argparse.getArgValue('artifacts-location') || 'artifacts',
    });

    if (artifactCapabilities) {
      const { log, screenshot, video } = artifactCapabilities;

      this._hooks = _.compact([
        this._createLogRecorderLifecycle(log()),
        this._createScreenshotterLifecycle(screenshot()),
        this._createVideoRecorderLifecycle(video()),
      ]);
    }
  }

  async onStart() {
    await Promise.all(this._hooks.map(hook => hook.onStart()));
  }

  async onBeforeTest(testSummary) {
    await Promise.all(this._hooks.map(hook => hook.onBeforeTest(testSummary)));
  }

  async onAfterTest(testSummary) {
    await Promise.all(this._hooks.map(hook => hook.onAfterTest(testSummary)));
  }

  async onExit() {
    await Promise.all(this._hooks.map(hook => hook.onExit()));
  }

  async onShutdown() {
    await Promise.all(this._recordings.map(r => r.stop()));
  }

  _createLogRecorderLifecycle(logRecorder) {
    if (!logRecorder) {
      return null;
    }

    const recordLogs = argparse.getArgValue('record-logs') || 'none';

    if (recordLogs === 'none') {
      return null;
    }

    return new RecorderLifecycle({
      shouldRecordStartup: true,
      keepOnlyFailedTestsRecordings: recordLogs === 'failing',
      pathBuilder: this._pathBuilder,
      registerRecording: this._registerRecording,
      recorder: logRecorder,
    });
  }

  _createScreenshotterLifecycle(screenshotter) {
    if (!screenshotter) {
      return null;
    }

    const takeScreenshots = argparse.getArgValue('take-screenshots') || 'none';

    if (takeScreenshots === 'none') {
      return null;
    }

    return new SnapshotterLifecycle({
      keepOnlyFailedTestsSnapshots: takeScreenshots === 'failing',
      pathBuilder: this._pathBuilder,
      snapshotter: screenshotter,
    });
  }

  _createVideoRecorderLifecycle(videoRecorder) {
    if (!videoRecorder) {
      return null;
    }

    const recordVideos = argparse.getArgValue('record-videos') || 'none';

    if (recordVideos === 'none') {
      return null;
    }

    return new RecorderLifecycle({
      shouldRecordStartup: true,
      keepOnlyFailedTestsRecordings: recordVideos === 'failing',
      pathBuilder: this._pathBuilder,
      registerRecording: this._registerRecording,
      recorder: videoRecorder,
    });
  }

  _registerRecording(recording) {
    this._recordings.push(recording);
  }
}

module.exports = ArtifactsManager;