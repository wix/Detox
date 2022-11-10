const { PassThrough } = require('stream');

const bunyan = require('bunyan');
const bds = require('bunyan-debug-stream');
const _ = require('lodash');

const { DetoxInternalError } = require('../../errors');

class BunyanLogger {
  constructor() {
    this._bunyan = bunyan.createLogger({ name: 'detox', streams: [] });
    /** @type {bunyan.Stream} */
    this._debugStream = null;
    /** @type {bunyan.Stream} */
    this._fileStream = null;
  }

  /**
   * @returns {bunyan}
   */
  get logger() {
    return this._bunyan;
  }

  /**
   * @param {Detox.DetoxLoggerConfig} config
   * @returns {this}
   */
  installDebugStream(config) {
    if (this._debugStream) {
      _.remove(this._bunyan['streams'], this._debugStream);
      // @ts-ignore
      this._debugStream.stream.end();
      this._debugStream = null;
    }

    const streamOptions = { out: null, ...config.options };
    /* istanbul ignore next */
    if (!streamOptions.out) {
      // This is a default if-else branch, used everywhere except for the unit tests.
      streamOptions.out = new PassThrough().pipe(process.stderr);
    }

    this._debugStream = {
      type: 'raw',
      level: config.level,
      stream: bds.default(streamOptions),
    };

    this._bunyan.addStream(this._debugStream);
    return this;
  }

  /**
   * @param {string} file
   * @returns {this}
   */
  installFileStream(file) {
    /* istanbul ignore next */
    if (this._fileStream) {
      // This is an impossible condition, but we keep it here for the sake of completeness.
      throw new DetoxInternalError('Trying to install a second file stream inside already initialized Bunyan logger');
    }

    this._fileStream = {
      level: 'trace',
      path: file,
    };

    this._bunyan.addStream(this._fileStream);

    return this;
  }
}

module.exports = BunyanLogger;
