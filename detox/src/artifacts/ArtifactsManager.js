const _ = require('lodash');
const log = require('npmlog');
const argparse = require('../utils/argparse');

const ArtifactPathBuilder =  require('./core/lifecycle/utils/ArtifactPathBuilder');
const RecorderLifecycle = require('./core/lifecycle/RecorderLifecycle');
const SnapshotterLifecycle = require('./core/lifecycle/SnapshotterLifecycle');

class ArtifactsManager {
  constructor({ artifactCapabilities }) {
    this._hooks = [];
    this._artifacts = [];
    this._finalizationPromise = Promise.resolve();

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
    await this._finalizationPromise;
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
      logRecorder ? this._createLogRecorderLifecycle(logRecorder) : null,
      screenshotter ? this._createScreenshotterLifecycle(screenshotter) : null,
      videoRecorder ? this._createVideoRecorderLifecycle(videoRecorder) : null,
    ]);
  }

  _createLogRecorderLifecycle(logRecorder) {
    const recordLogs = argparse.getArgValue('record-logs') || 'none';
    if (recordLogs === 'none') {
      return null;
    }

    return new RecorderLifecycle({
      shouldRecordStartup: true,
      keepOnlyFailedTestsRecordings: recordLogs === 'failing',
      pathBuilder: this._pathBuilder,
      recorder: logRecorder,
      enqueueFinalizationTask: this._enqueueFinalizationTask.bind(this),
    });
  }

  _createScreenshotterLifecycle(screenshotter) {
    const takeScreenshots = argparse.getArgValue('take-screenshots') || 'none';
    if (takeScreenshots === 'none') {
      return null;
    }

    return new SnapshotterLifecycle({
      keepOnlyFailedTestsSnapshots: takeScreenshots === 'failing',
      pathBuilder: this._pathBuilder,
      snapshotter: screenshotter,
      enqueueFinalizationTask: this._enqueueFinalizationTask.bind(this),
    });
  }

  _createVideoRecorderLifecycle(videoRecorder) {
    const recordVideos = argparse.getArgValue('record-videos') || 'none';
    if (recordVideos === 'none') {
      return null;
    }

    return new RecorderLifecycle({
      shouldRecordStartup: false,
      keepOnlyFailedTestsRecordings: recordVideos === 'failing',
      pathBuilder: this._pathBuilder,
      recorder: videoRecorder,
      enqueueFinalizationTask: this._enqueueFinalizationTask.bind(this),
    });
  }

  _registerArtifact(artifact) {
    this._artifacts.push(artifact);
  }

  _enqueueFinalizationTask(finalizationFunction) {
    this._finalizationPromise = this._finalizationPromise
      .then(finalizationFunction)
      .catch(this._suppressFinalizationError);

    return this._finalizationPromise;
  }

  _suppressFinalizationError(e) {
    log.error('ArtifactsManager', 'Finalization error:\n%j', e);
  }
}

module.exports = ArtifactsManager;