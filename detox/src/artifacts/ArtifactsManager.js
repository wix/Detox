const _ = require('lodash');
const argparse = require('../utils/argparse');

const ArtifactPathBuilder =  require('./core/lifecycle/utils/ArtifactPathBuilder');
const RecorderLifecycle = require('./core/lifecycle/RecorderLifecycle');
const SnapshotterLifecycle = require('./core/lifecycle/SnapshotterLifecycle');

class ArtifactsManager {
  constructor({ artifactCapabilities }) {
    this._hooks = [];
    this._artifacts = [];

    this._pathBuilder = new ArtifactPathBuilder({
      artifactsRootDir: argparse.getArgValue('artifacts-location') || 'artifacts',
    });

    if (artifactCapabilities) {
      this._registerArtifactLifecycles(artifactCapabilities);
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
    await Promise.all(this._artifacts.map(r => r.discard()));
  }

  _registerArtifactLifecycles({ log, screenshot, video }) {
    const artifactsRegistry = {
      registerArtifact: this._registerArtifact.bind(this),
    };

    const logRecorder = log({ artifactsRegistry });
    const screenshotter = screenshot({ artifactsRegistry });
    const videoRecorder = video({ artifactsRegistry });

    this._hooks = _.compact([
      this._createLogRecorderLifecycle(logRecorder),
      this._createScreenshotterLifecycle(screenshotter),
      this._createVideoRecorderLifecycle(videoRecorder),
    ]);
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
      recorder: videoRecorder,
    });
  }

  _registerArtifact(artifact) {
    this._artifacts.push(artifact);
  }
}

module.exports = ArtifactsManager;