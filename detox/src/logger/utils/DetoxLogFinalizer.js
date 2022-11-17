const path = require('path');

const fs = require('fs-extra');

const temporary = require('../../artifacts/utils/temporaryPath');

const { BunyanTransformer, ChromeTraceTransformer } = require('./streams');

/**
 * @typedef DetoxLogFinalizerConfig
 * @property {import('../../ipc/SessionState')} session
 * @property {import('../DetoxLogger')} logger
 */

class DetoxLogFinalizer {
  /** @param {DetoxLogFinalizerConfig} config */
  constructor(config) {
    this._session = config.session;
    this._bunyanTransformer = new BunyanTransformer(
      config.logger.child({ cat: 'logger' }),
    );
    this._chromeTransformer = new ChromeTraceTransformer();
  }

  createEventStream() {
    const sessionId = this._session.id;
    const logs = temporary.find.jsonl.sync(`${sessionId}.*`);

    const toChromeTrace = this._chromeTransformer.createStream();
    return this._bunyanTransformer.uniteSessionLogs(logs).pipe(toChromeTrace);
  }

  async finalize() {
    const sessionId = this._session.id;
    const logs = await temporary.find.jsonl.async(`${sessionId}.*`);
    if (logs.length === 0) {
      return;
    }

    if (this._shouldSaveLogs()) {
      const rootDir = this._config.artifacts.rootDir;
      await this.mergeLogs(logs, rootDir);
    }

    await Promise.all(logs.map(filepath => fs.remove(filepath)));
  }

  async mergeLogs(logs, destinationDirectory) {
    await fs.mkdirp(destinationDirectory);

    const firstPass = this._bunyanTransformer.uniteSessionLogs(logs);
    await this._chromeTransformer.scanThreadIDs(firstPass);

    const secondPass = this._bunyanTransformer.uniteSessionLogs(logs);
    const outStreams = [
      this._createPlainFileStream(path.join(destinationDirectory, 'detox.log')),
      this._createChromeTraceStream(path.join(destinationDirectory, 'detox.trace.json'))
    ];

    await Promise.all(outStreams.map(stream => {
      return new Promise((resolve, reject) => {
        stream.target
          .on('finish', resolve)
          .on('error', reject);

        secondPass.pipe(stream.writable);
      });
    }));
  }

  finalizeSync() {
    const sessionId = this._session.id;
    const logs = temporary.find.jsonl.sync(`${sessionId}.*`);
    if (logs.length === 0) {
      return;
    }

    const shouldSaveLogs = this._shouldSaveLogs(true);
    const rootDir = shouldSaveLogs ? this._config.artifacts.rootDir : '';
    if (shouldSaveLogs) {
      fs.mkdirpSync(rootDir);
    }

    for (const log of logs) {
      if (shouldSaveLogs) {
        const dest = path.join(rootDir, path.basename(log));
        this._safeMoveSync(log, dest);
      } else {
        this._safeRemoveSync(log);
      }
    }
  }

  _createPlainFileStream(filePath) {
    const bunyanOptions = this._config.logger.options;
    const transformer = this._bunyanTransformer.createPlainTransformer(bunyanOptions);
    const fileStream = fs.createWriteStream(filePath);
    transformer.readable.pipe(fileStream);

    return { writable: transformer.writable, target: fileStream };
  }

  _createChromeTraceStream(filePath) {
    const transformer = this._chromeTransformer.createSerializedStream();
    const fileStream = fs.createWriteStream(filePath);
    transformer.readable.pipe(fileStream);

    return { writable: transformer.writable, target: fileStream };
  }

  /* istanbul ignore next */
  _safeMoveSync(src, dest) {
    // Using console.* instead of logger.* because this is the end of the execution,
    // and the logger is already closed.

    try {
      fs.moveSync(src, dest);
    } catch (moveError) {
      console.warn(`Failed to move a log file from: ${src}.\nReason: ${moveError.message}`);
      try {
        fs.copySync(src, dest);
      } catch (copyError) {
        console.warn(`Attempt to copy the file also failed.\nReason: ${copyError.message}`);
      }
    }
  }

  /* istanbul ignore next */
  _safeRemoveSync(filepath) {
    try {
      fs.removeSync(filepath);
    } catch (removeError) {
      console.warn(`Failed to remove a log file at: ${filepath}.\nReason: ${removeError.message}`);
    }
  }

  /** @private */
  get _config() {
    // The config appears later in the lifecycle, so we need to access it lazily
    return this._session.detoxConfig;
  }

  /** @private */
  _shouldSaveLogs(isEmergencyExit = false) {
    if (!this._config) {
      return false;
    }

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

    if (isEmergencyExit) {
      return true;
    }

    return this._session.testResults.some(r => !r.success);
  }
}

module.exports = DetoxLogFinalizer;
