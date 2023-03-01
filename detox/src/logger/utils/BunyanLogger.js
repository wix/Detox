const { PassThrough } = require('stream');
const { promisify } = require('util');

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

    this._bunyan.addStream({
      type: 'raw',
      level: config.level,
      stream: bds.default(streamOptions),
    });

    this._debugStream = _.last(this._bunyan['streams']);

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

  async closeFileStreams() {
    const internalBunyanStreams = this._bunyan['streams'];
    const openFileStreams = _.filter(internalBunyanStreams, this._isOpenFileStream);
    _.remove(internalBunyanStreams, openFileStreams);

    await Promise.all(openFileStreams.map(bunyanStream => {
      const stream = bunyanStream.stream;
      return promisify(stream.end.bind(stream))();
    }));
  }

  /** @private */
  _isOpenFileStream = (bunyanStream) => {
    switch (bunyanStream.type) {
      case 'file':
        return bunyanStream.path && !bunyanStream.stream.destroyed;
      case 'raw':
        /* istanbul ignore next */
        const stream = bunyanStream.stream === this._debugStream.stream
          ? bunyanStream.stream._out
          : bunyanStream.stream;

        /* istanbul ignore next */
        return stream.fd > 2 && !stream.closed;
    }
  };
}

module.exports = BunyanLogger;
