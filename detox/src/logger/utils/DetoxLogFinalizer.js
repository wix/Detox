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

      const tidHashMap = await this._scanForThreadIds(logs);
      const mergedStream = streamUtils.uniteSessionLogs(logs);

      await Promise.all([
        pipe(mergedStream, streamUtils.debugStream(this._config.logger.options), out1Stream),
        pipe(mergedStream, streamUtils.chromeTraceStream(tidHashMap), streamUtils.writeJSON(), out2Stream),
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

  async _scanForThreadIds(logs) {
    const streamUtils = require('../../logger/utils/streamUtils');
    const processes = await new Promise((resolve, reject) => {
      const result = {};
      streamUtils.uniteSessionLogs(logs)
        .on('end', () => resolve(result))
        .on('error', (err) => reject(err))
        .on('data', (event) => {
          const { ph, pid, tid, cat } = event;
          if (ph === 'B' || ph === 'i') {
            const categories = (result[pid] = result[pid] || {});
            const mainCategory = String(cat).split(',')[0];
            const tids = (categories[mainCategory] = categories[mainCategory] || []);
            if (!tids.includes(tid)) {
              tids.push(tid);
            }
          }
        });
    });

    const tidArray = Object.entries(processes).flatMap(([pid, categories]) => {
      return Object.entries(categories).flatMap(([category, tids]) => {
        return tids.map(tid => `${pid}:${category}:${tid}`);
      });
    });

    return new Map(tidArray.map((hash, index) => [hash, index]));
  }
}

module.exports = DetoxLogFinalizer;
