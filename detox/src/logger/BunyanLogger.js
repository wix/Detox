const { PassThrough } = require('stream');

const bunyan = require('bunyan');
const bds = require('bunyan-debug-stream');
const _ = require('lodash');

const { DetoxInternalError } = require('../errors');

class BunyanLogger {
  /**
   * @param {Detox.DetoxLoggerConfig & { file?: string; }} config
   */
  constructor(config) {
    this._bunyan = bunyan.createLogger({ name: 'detox', streams: [] });
    /** @type {bunyan.Stream} */
    this._debugStream = null;
    /** @type {bunyan.Stream} */
    this._fileStream = null;

    this.installDebugStream(config);
    this.installFileStream(config);
  }

  /**
   * @returns {bunyan}
   */
  get logger() {
    return this._bunyan;
  }

  /**
   * @param {Detox.DetoxLoggerConfig} config
   */
  installDebugStream(config) {
    const level = config.level || 'info';
    const { out = process.stderr, ...streamOptions } = config.options;
    const passthrough = new PassThrough().pipe(out);

    if (this._debugStream) {
      _.remove(this._bunyan['streams'], this._debugStream);
      // @ts-ignore
      this._debugStream.stream.end();
      this._debugStream = null;
    }

    this._debugStream = {
      type: 'raw',
      level,
      stream: bds.default({
        ...streamOptions,
        out: passthrough,
      }),
    };

    this._bunyan.addStream(this._debugStream);
  }

  /**
   * @param {{ file?: string; }} config
   */
  installFileStream(config) {
    if (this._fileStream) {
      throw new DetoxInternalError('Trying to install a second file stream inside already initialized Bunyan logger');
    }

    if (config.file) {
      this._fileStream = {
        level: 'trace',
        path: config.file,
      };

      this._bunyan.addStream(this._fileStream);
    }
  }
}

module.exports = BunyanLogger;
