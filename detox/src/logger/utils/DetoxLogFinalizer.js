const path = require('path');
const { promisify } = require('util');

const fs = require('fs-extra');
const glob = require('glob');
const pipe = require('multipipe');

const temporary = require('../../artifacts/utils/temporaryPath');

const globAsync = promisify(glob);
const globSync = glob.sync;

/**
 * @typedef DetoxLogFinalizerConfig
 * @property {import('../../ipc/SessionState')} session
 */

class DetoxLogFinalizer {
  /** @param {DetoxLogFinalizerConfig} config */
  constructor(config) {
    this._session = config.session;
  }

  async finalize() {
    const sessionId = this._session.id;
    const logs = await globAsync(temporary.for.jsonl(`${sessionId}.*`));
    if (logs.length === 0) {
      return;
    }

    if (this._areLogsEnabled()) {
      const streamUtils = require('../../logger/utils/streamUtils');
      const rootDir = this._config.artifacts.rootDir;

      await fs.mkdirp(rootDir);
      const [out1Stream, out2Stream] = ['detox.log', 'detox.trace.json']
        .map((filename) => fs.createWriteStream(path.join(rootDir, filename)));

      const mergedStream = streamUtils.uniteSessionLogs(sessionId);

      await Promise.all([
        pipe(mergedStream, streamUtils.debugStream(this._config.logger.options), out1Stream),
        pipe(mergedStream, streamUtils.chromeTraceStream(), streamUtils.writeJSON(), out2Stream),
      ]);
    }

    await Promise.all(logs.map(filepath => fs.remove(filepath)));
  }

  finalizeSync() {
    const sessionId = this._session.id;
    const rootDir = this._config.artifacts.rootDir;
    const logsEnabled = this._areLogsEnabled();

    if (logsEnabled) {
      fs.mkdirpSync(rootDir);
    }

    const logs = globSync(temporary.for.jsonl(`${sessionId}.*`));

    for (const log of logs) {
      if (logsEnabled) {
        fs.moveSync(log, path.join(rootDir, path.basename(log)));
      } else {
        fs.removeSync(log);
      }
    }
  }

  get _config() {
    // The config appears later in the lifecycle, so we need to access it lazily
    return this._session.detoxConfig;
  }

  _areLogsEnabled() {
    const { rootDir, plugins } = this._config.artifacts;
    if (!rootDir || !plugins) {
      return false;
    }

    if (!plugins.log.enabled) {
      return false;
    }

    if (!plugins.log.keepOnlyFailedTestsArtifacts) {
      return true;
    }

    return this._session.testResults.some(r => !r.success);
  }
}

module.exports = DetoxLogFinalizer;
